"use client";

import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { defaultPolicies, type ToolCategory, type ToolPolicy } from "./agent-tools";

const SETTINGS_KEY = "trygc:agent-settings:v1";

export type ProviderId = "gateway" | "anthropic" | "openai" | "google" | "ollama" | "qwen" | "zen" | "compatible";

export interface ProviderDescriptor {
  id: ProviderId;
  name: string;
  blurb: string;
  /** Where a visitor gets a key, shown in the setup card. */
  keyUrl?: string;
  envVar: string;
  needsBaseUrl?: boolean;
  /** Prefilled for hosted endpoints; still editable for self-hosted or regional deployments. */
  defaultBaseUrl?: string;
  /** Provider-published OpenAI-style catalogue, proxied so the browser avoids CORS. */
  catalogueUrl?: string;
  /** Used when the live catalogue is unavailable. */
  fallbackModels: string[];
}

export const providerCatalogue: ProviderDescriptor[] = [
  {
    id: "gateway",
    name: "Vercel AI Gateway",
    blurb: "One key, every provider below plus 30 more. Recommended.",
    keyUrl: "https://vercel.com/docs/ai-gateway",
    envVar: "AI_GATEWAY_API_KEY",
    fallbackModels: [
      "anthropic/claude-opus-5",
      "anthropic/claude-sonnet-5",
      "openai/gpt-6-astra",
      "google/gemini-3.8-flash",
    ],
  },
  {
    id: "anthropic",
    name: "Anthropic",
    blurb: "Claude models, called directly.",
    keyUrl: "https://console.anthropic.com/settings/keys",
    envVar: "ANTHROPIC_API_KEY",
    fallbackModels: ["claude-opus-5", "claude-sonnet-5", "claude-haiku-4.5"],
  },
  {
    id: "openai",
    name: "OpenAI",
    blurb: "GPT and o-series models, called directly.",
    keyUrl: "https://platform.openai.com/api-keys",
    envVar: "OPENAI_API_KEY",
    fallbackModels: ["gpt-6-astra", "gpt-5.6-sol", "gpt-5", "o4-mini"],
  },
  {
    id: "google",
    name: "Google",
    blurb: "Gemini models, called directly.",
    keyUrl: "https://aistudio.google.com/apikey",
    envVar: "GOOGLE_GENERATIVE_AI_API_KEY",
    fallbackModels: ["gemini-3.8-flash", "gemini-3.1-pro-preview", "gemini-2.5-pro"],
  },
  {
    id: "ollama",
    name: "Ollama Cloud",
    blurb: "Hosted open models from Ollama, or point the base URL at a local ollama serve.",
    keyUrl: "https://ollama.com/settings/keys",
    envVar: "OLLAMA_API_KEY",
    defaultBaseUrl: "https://ollama.com/v1",
    catalogueUrl: "https://ollama.com/v1/models",
    fallbackModels: ["glm-5.3", "kimi-k3", "minimax-m3", "gpt-oss:120b", "qwen3.5:397b"],
  },
  {
    id: "qwen",
    name: "QwenCloud",
    blurb: "Alibaba DashScope in OpenAI-compatible mode.",
    keyUrl: "https://home.qwencloud.com/api-keys",
    envVar: "DASHSCOPE_API_KEY",
    defaultBaseUrl: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
    fallbackModels: ["qwen3-max", "qwen-plus", "qwen-flash", "qwen-turbo", "qwen3-235b-a22b", "qwen-vl-max"],
  },
  {
    id: "zen",
    name: "OpenCode Zen",
    blurb: "The OpenCode gateway, with frontier models behind one key.",
    keyUrl: "https://opencode.ai/zen",
    envVar: "OPENCODE_ZEN_API_KEY",
    defaultBaseUrl: "https://opencode.ai/zen/v1",
    catalogueUrl: "https://opencode.ai/zen/v1/models",
    fallbackModels: ["claude-opus-5", "claude-sonnet-5", "claude-haiku-4-5", "big-pickle"],
  },
  {
    id: "compatible",
    name: "OpenAI-compatible",
    blurb:
      "Any endpoint speaking the OpenAI API: Groq, Together, OpenRouter, DeepSeek, Fireworks, vLLM, Ollama, LM Studio.",
    envVar: "OPENAI_COMPATIBLE_API_KEY",
    needsBaseUrl: true,
    fallbackModels: [],
  },
];

export interface SavedPrompt {
  id: string;
  title: string;
  prompt: string;
  builtIn?: boolean;
}

export interface ScheduledBrief {
  id: string;
  promptId: string;
  cadence: "daily" | "weekly" | "monthly";
  hour: number;
  enabled: boolean;
  lastRunAt?: string;
}

export const builtInPrompts: SavedPrompt[] = [
  {
    id: "sp-pipeline",
    title: "Monday pipeline review",
    builtIn: true,
    prompt:
      "Give me a pipeline review for the current scope. Show the headline metrics, chart open pipeline by stage, then list every quotation sitting with management or finance beyond the 48 hour SLA with how long it has waited and who owns it.",
  },
  {
    id: "sp-collections",
    title: "Collections chase list",
    builtIn: true,
    prompt:
      "Build me a collections chase list. List every invoice with an outstanding balance, oldest due date first, with the company, balance, days overdue and collections owner. Flag anything more than 30 days past due.",
  },
  {
    id: "sp-sla",
    title: "SLA breach digest",
    builtIn: true,
    prompt:
      "Show the approval SLA position. Which quotations have breached 48 hours, which are approaching it, and which owners have the most items waiting? Recommend the single most urgent action.",
  },
  {
    id: "sp-margin",
    title: "Margin check before approval",
    builtIn: true,
    prompt:
      "For every quotation currently in management or finance review, show the value, recorded cost, resulting margin and margin percent. Rank them by margin percent ascending so I can see the weakest first.",
  },
  {
    id: "sp-creators",
    title: "Creator entitlement position",
    builtIn: true,
    prompt:
      "Chart the creator entitlement mix and explain the balance: how many are available, reserved, consumed and expired, and which companies are close to exhausting their entitlement.",
  },
  {
    id: "sp-brief",
    title: "Executive brief",
    builtIn: true,
    prompt:
      "Write me a short executive brief for today: headline metrics, the exception queue, the deals closest to closing, and the three things I should act on first. Keep it under 200 words plus the visuals.",
  },
];

export interface AgentSettings {
  providerId: ProviderId;
  modelId: string;
  /** Held in the browser only, never written to the server except as a per-request header. */
  apiKeys: Partial<Record<ProviderId, string>>;
  baseUrls: Partial<Record<ProviderId, string>>;
  policies: Record<ToolCategory, ToolPolicy>;
  voiceInput: boolean;
  voiceOutput: boolean;
  savedPrompts: SavedPrompt[];
  schedules: ScheduledBrief[];
}

const defaultSettings: AgentSettings = {
  providerId: "gateway",
  modelId: "anthropic/claude-opus-5",
  apiKeys: {},
  baseUrls: {},
  policies: { ...defaultPolicies },
  voiceInput: true,
  voiceOutput: false,
  savedPrompts: builtInPrompts,
  schedules: [],
};

interface AgentSettingsValue extends AgentSettings {
  hydrated: boolean;
  update: (patch: Partial<AgentSettings>) => void;
  setPolicy: (category: ToolCategory, policy: ToolPolicy) => void;
  setApiKey: (provider: ProviderId, key: string) => void;
  setBaseUrl: (provider: ProviderId, url: string) => void;
  addPrompt: (title: string, prompt: string) => void;
  removePrompt: (id: string) => void;
  toggleSchedule: (promptId: string, cadence: ScheduledBrief["cadence"], hour: number) => void;
  removeSchedule: (id: string) => void;
  /** Key the browser holds for the active provider, if any. */
  activeKey?: string;
  /** Provider ids this browser holds a key for. Identifiers only, never values. */
  configuredProviderIds: ProviderId[];
  /** Base URLs this browser has set or inherits from a preset. */
  baseUrlMap: Partial<Record<ProviderId, string>>;
  activeBaseUrl?: string;
  provider: ProviderDescriptor;
}

const AgentSettingsContext = createContext<AgentSettingsValue | null>(null);

export function AgentSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AgentSettings>(defaultSettings);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(SETTINGS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<AgentSettings>;
        setSettings({
          ...defaultSettings,
          ...parsed,
          policies: { ...defaultPolicies, ...(parsed.policies ?? {}) },
          apiKeys: parsed.apiKeys ?? {},
          baseUrls: parsed.baseUrls ?? {},
          // Built-ins are code, not data, so they refresh with the app.
          savedPrompts: [...builtInPrompts, ...(parsed.savedPrompts ?? []).filter((item) => !item.builtIn)],
          schedules: parsed.schedules ?? [],
        });
      }
    } catch {
      window.localStorage.removeItem(SETTINGS_KEY);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      // A full quota should not break the chat; settings simply stop persisting.
    }
  }, [hydrated, settings]);

  const update = useCallback((patch: Partial<AgentSettings>) => {
    setSettings((current) => {
      const next = { ...current, ...patch };
      // A model id belongs to one provider. Carrying it across a provider
      // change sends a name the new endpoint has never heard of.
      if (patch.providerId && patch.providerId !== current.providerId && patch.modelId === undefined) {
        const target = providerCatalogue.find((item) => item.id === patch.providerId);
        next.modelId = target?.fallbackModels[0] ?? "";
      }
      return next;
    });
  }, []);

  const value = useMemo<AgentSettingsValue>(() => {
    const provider = providerCatalogue.find((item) => item.id === settings.providerId) ?? providerCatalogue[0];
    return {
      ...settings,
      hydrated,
      provider,
      activeKey: settings.apiKeys[settings.providerId],
      configuredProviderIds: providerCatalogue.filter((item) => settings.apiKeys[item.id]).map((item) => item.id),
      baseUrlMap: Object.fromEntries(
        providerCatalogue
          .map((item) => [item.id, settings.baseUrls[item.id] || item.defaultBaseUrl])
          .filter(([, value]) => Boolean(value)),
      ),
      activeBaseUrl: settings.baseUrls[settings.providerId] || provider.defaultBaseUrl,
      update,
      setPolicy: (category, policy) =>
        setSettings((current) => ({ ...current, policies: { ...current.policies, [category]: policy } })),
      setApiKey: (providerId, key) =>
        setSettings((current) => ({ ...current, apiKeys: { ...current.apiKeys, [providerId]: key } })),
      setBaseUrl: (providerId, url) =>
        setSettings((current) => ({ ...current, baseUrls: { ...current.baseUrls, [providerId]: url } })),
      addPrompt: (title, prompt) =>
        setSettings((current) => ({
          ...current,
          savedPrompts: [...current.savedPrompts, { id: `sp-${Date.now().toString(36)}`, title, prompt }],
        })),
      removePrompt: (id) =>
        setSettings((current) => ({
          ...current,
          savedPrompts: current.savedPrompts.filter((item) => item.id !== id),
          schedules: current.schedules.filter((item) => item.promptId !== id),
        })),
      toggleSchedule: (promptId, cadence, hour) =>
        setSettings((current) => {
          const existing = current.schedules.find((item) => item.promptId === promptId);
          if (existing) {
            return {
              ...current,
              schedules: current.schedules.map((item) =>
                item.promptId === promptId ? { ...item, cadence, hour, enabled: !item.enabled } : item,
              ),
            };
          }
          return {
            ...current,
            schedules: [
              ...current.schedules,
              { id: `sc-${Date.now().toString(36)}`, promptId, cadence, hour, enabled: true },
            ],
          };
        }),
      removeSchedule: (id) =>
        setSettings((current) => ({ ...current, schedules: current.schedules.filter((item) => item.id !== id) })),
    };
  }, [settings, hydrated, update]);

  return <AgentSettingsContext.Provider value={value}>{children}</AgentSettingsContext.Provider>;
}

export function useAgentSettings() {
  const context = useContext(AgentSettingsContext);
  if (!context) throw new Error("useAgentSettings must be used inside AgentSettingsProvider");
  return context;
}
