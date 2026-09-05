import { createAnthropic } from "@ai-sdk/anthropic";
import { createGateway } from "@ai-sdk/gateway";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";

/** Server-only. Resolves a provider selection into a language model. */

export type AgentProviderId = "gateway" | "anthropic" | "openai" | "google" | "ollama" | "qwen" | "zen" | "compatible";

export const agentProviderIds: AgentProviderId[] = [
  "gateway",
  "anthropic",
  "openai",
  "google",
  "zen",
  "ollama",
  "qwen",
  "compatible",
];

export interface ProviderCredential {
  apiKey?: string;
  baseURL?: string;
}

export interface ModelRequest {
  providerId?: AgentProviderId;
  modelId?: string;
  /** Sent only when the visitor is using a key held in their own browser. */
  apiKey?: string;
  baseURL?: string;
  /**
   * Every credential the browser holds, so a provider that is configured can
   * take over when the selected one is not.
   */
  credentials?: Partial<Record<AgentProviderId, ProviderCredential>>;
  /** Set false to fail loudly on the selected provider instead of falling through. */
  allowFallback?: boolean;
}

interface ProviderProfile {
  label: string;
  envVars: string[];
  /** Used when falling back, since the selected model rarely exists elsewhere. */
  defaultModel?: string;
  baseURL?: string;
  requiresBaseUrl?: boolean;
}

const profiles: Record<AgentProviderId, ProviderProfile> = {
  gateway: {
    label: "Vercel AI Gateway",
    envVars: ["AI_GATEWAY_API_KEY", "VERCEL_OIDC_TOKEN"],
    defaultModel: "anthropic/claude-sonnet-5",
  },
  anthropic: { label: "Anthropic", envVars: ["ANTHROPIC_API_KEY"], defaultModel: "claude-sonnet-5" },
  openai: { label: "OpenAI", envVars: ["OPENAI_API_KEY"], defaultModel: "gpt-5.4" },
  google: {
    label: "Google",
    envVars: ["GOOGLE_GENERATIVE_AI_API_KEY", "GOOGLE_API_KEY"],
    defaultModel: "gemini-3-pro",
  },
  zen: {
    label: "OpenCode Zen",
    envVars: ["OPENCODE_ZEN_API_KEY"],
    baseURL: "https://opencode.ai/zen/v1",
    defaultModel: "claude-sonnet-5",
  },
  ollama: {
    label: "Ollama Cloud",
    envVars: ["OLLAMA_API_KEY"],
    baseURL: "https://ollama.com/v1",
    defaultModel: "glm-5.3",
  },
  qwen: {
    label: "QwenCloud",
    envVars: ["DASHSCOPE_API_KEY", "QWEN_API_KEY"],
    baseURL: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
    defaultModel: "qwen-plus",
  },
  compatible: {
    label: "OpenAI-compatible endpoint",
    envVars: ["OPENAI_COMPATIBLE_API_KEY"],
    requiresBaseUrl: true,
  },
};

/**
 * Only a runtime on this machine answers without a credential. Hosted
 * endpoints all require a key, so claiming otherwise would report a
 * provider as ready and then fail on the first message.
 */
function isLocalEndpoint(baseURL?: string) {
  if (!baseURL) return false;
  try {
    const { hostname } = new URL(baseURL);
    return ["localhost", "127.0.0.1", "0.0.0.0", "::1", "host.docker.internal"].includes(hostname);
  } catch {
    return false;
  }
}

export function envKey(...names: string[]) {
  for (const name of names) {
    const value = process.env[name];
    if (value) return value;
  }
  return undefined;
}

function baseUrlFor(providerId: AgentProviderId, supplied?: string) {
  if (supplied) return supplied;
  // QWEN_BASE_URL is a QwenCloud override only; it must not reach other presets.
  if (providerId === "qwen" && process.env.QWEN_BASE_URL) return process.env.QWEN_BASE_URL;
  if (providerId === "compatible") return envKey("OPENAI_COMPATIBLE_BASE_URL");
  return profiles[providerId].baseURL;
}

function credentialFor(providerId: AgentProviderId, request: ModelRequest): ProviderCredential {
  const fromMap = request.credentials?.[providerId] ?? {};
  // A key typed for the selected provider takes precedence over the stored map.
  const isSelected = (request.providerId ?? "gateway") === providerId;
  return {
    apiKey: (isSelected ? request.apiKey : undefined) ?? fromMap.apiKey,
    baseURL: (isSelected ? request.baseURL : undefined) ?? fromMap.baseURL,
  };
}

/** Whether this provider could actually answer, without making a request. */
export function providerIsConfigured(providerId: AgentProviderId, request: ModelRequest = {}) {
  const profile = profiles[providerId];
  const credential = credentialFor(providerId, request);
  const baseURL = baseUrlFor(providerId, credential.baseURL);
  if (profile.requiresBaseUrl && !baseURL) return false;
  if (credential.apiKey) return true;
  if (envKey(...profile.envVars)) return true;
  return isLocalEndpoint(baseURL);
}

function buildModel(providerId: AgentProviderId, modelId: string, request: ModelRequest): LanguageModel | null {
  const profile = profiles[providerId];
  const credential = credentialFor(providerId, request);
  const apiKey = credential.apiKey ?? envKey(...profile.envVars);
  const baseURL = baseUrlFor(providerId, credential.baseURL);

  switch (providerId) {
    case "anthropic":
      return apiKey ? createAnthropic({ apiKey, baseURL })(modelId) : null;
    case "openai":
      return apiKey ? createOpenAI({ apiKey, baseURL })(modelId) : null;
    case "google":
      return apiKey ? createGoogleGenerativeAI({ apiKey, baseURL })(modelId) : null;
    case "gateway":
      return apiKey ? createGateway({ apiKey, baseURL })(modelId) : null;
    default: {
      // Ollama, QwenCloud, OpenCode Zen and any other OpenAI-compatible endpoint.
      if (!baseURL) return null;
      if (!apiKey && !isLocalEndpoint(baseURL)) return null;
      return createOpenAI({ apiKey: apiKey ?? "not-required", baseURL, name: providerId })(modelId);
    }
  }
}

export interface ResolvedModel {
  model: LanguageModel;
  providerId: AgentProviderId;
  modelId: string;
  /** True when the selected provider could not be used and another took over. */
  viaFallback: boolean;
}

/**
 * Resolves the selected provider, then falls through to any other provider that
 * holds a credential. Without this, a key saved for one provider is unusable
 * while a different one happens to be selected.
 */
export function resolveAgentModel(request: ModelRequest): ResolvedModel | { error: string } {
  const selected: AgentProviderId = request.providerId ?? "gateway";
  const requestedModel = request.modelId?.trim();

  const candidates: AgentProviderId[] = [selected];
  if (request.allowFallback !== false) {
    for (const id of agentProviderIds) {
      if (id !== selected) candidates.push(id);
    }
  }

  for (const providerId of candidates) {
    if (!providerIsConfigured(providerId, request)) continue;
    const isSelected = providerId === selected;
    const modelId = isSelected
      ? (requestedModel ?? profiles[providerId].defaultModel)
      : profiles[providerId].defaultModel;
    if (!modelId) continue;
    const model = buildModel(providerId, modelId, request);
    if (model) return { model, providerId, modelId, viaFallback: !isSelected };
  }

  const profile = profiles[selected];
  const envHint = profile.envVars[0];
  return {
    error: `${profile.label} is not configured, and no other provider has a key either. Add ${envHint} to .env.local, or open Agent settings and save a key for any provider.`,
  };
}

export function providerLabel(providerId: AgentProviderId) {
  return profiles[providerId].label;
}

/** Reports which providers are ready, for the setup card and the settings page. */
export function configuredProviders(request: ModelRequest = {}) {
  return agentProviderIds
    .filter((id) => providerIsConfigured(id, request))
    .map((id) => ({ id, label: profiles[id].label }));
}
