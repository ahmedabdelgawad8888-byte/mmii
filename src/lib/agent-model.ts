import { createAnthropic } from "@ai-sdk/anthropic";
import { createGateway } from "@ai-sdk/gateway";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";

/** Server-only. Resolves a provider selection into a language model. */

export type AgentProviderId = "gateway" | "anthropic" | "openai" | "google" | "ollama" | "qwen" | "zen" | "compatible";

export interface ModelRequest {
  providerId?: AgentProviderId;
  modelId?: string;
  /** Sent only when the visitor is using a key held in their own browser. */
  apiKey?: string;
  baseURL?: string;
}

/** Hosted endpoints that speak the OpenAI wire format. */
const openAiCompatibleDefaults: Partial<Record<AgentProviderId, { baseURL: string; envVars: string[] }>> = {
  ollama: { baseURL: "https://ollama.com/v1", envVars: ["OLLAMA_API_KEY"] },
  qwen: {
    baseURL: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
    envVars: ["DASHSCOPE_API_KEY", "QWEN_API_KEY"],
  },
  zen: { baseURL: "https://opencode.ai/zen/v1", envVars: ["OPENCODE_ZEN_API_KEY"] },
};

export function envKey(...names: string[]) {
  for (const name of names) {
    const value = process.env[name];
    if (value) return value;
  }
  return undefined;
}

export function resolveAgentModel(request: ModelRequest): { model: LanguageModel } | { error: string } {
  const providerId: AgentProviderId = request.providerId ?? "gateway";
  const modelId = request.modelId;
  if (!modelId) return { error: "No model selected." };

  switch (providerId) {
    case "anthropic": {
      const apiKey = request.apiKey ?? envKey("ANTHROPIC_API_KEY");
      if (!apiKey) return { error: "Anthropic is not configured. Add ANTHROPIC_API_KEY or paste a key in settings." };
      return { model: createAnthropic({ apiKey, baseURL: request.baseURL })(modelId) };
    }
    case "openai": {
      const apiKey = request.apiKey ?? envKey("OPENAI_API_KEY");
      if (!apiKey) return { error: "OpenAI is not configured. Add OPENAI_API_KEY or paste a key in settings." };
      return { model: createOpenAI({ apiKey, baseURL: request.baseURL })(modelId) };
    }
    case "google": {
      const apiKey = request.apiKey ?? envKey("GOOGLE_GENERATIVE_AI_API_KEY", "GOOGLE_API_KEY");
      if (!apiKey) {
        return { error: "Google is not configured. Add GOOGLE_GENERATIVE_AI_API_KEY or paste a key in settings." };
      }
      return { model: createGoogleGenerativeAI({ apiKey, baseURL: request.baseURL })(modelId) };
    }
    case "ollama":
    case "qwen":
    case "zen": {
      const preset = openAiCompatibleDefaults[providerId];
      const baseURL = request.baseURL ?? process.env.QWEN_BASE_URL ?? preset?.baseURL;
      if (!baseURL) return { error: "No base URL is configured for this provider." };
      // A local ollama serve needs no key, so an empty value is allowed through.
      const apiKey = request.apiKey ?? envKey(...(preset?.envVars ?? [])) ?? "not-required";
      return { model: createOpenAI({ apiKey, baseURL, name: providerId })(modelId) };
    }
    case "compatible": {
      // Any OpenAI-compatible endpoint: Groq, Together, OpenRouter, DeepSeek,
      // Mistral, Fireworks, vLLM, Ollama, LM Studio, or a private gateway.
      const baseURL = request.baseURL ?? envKey("OPENAI_COMPATIBLE_BASE_URL");
      if (!baseURL) return { error: "Set a base URL for the OpenAI-compatible endpoint in settings." };
      const apiKey = request.apiKey ?? envKey("OPENAI_COMPATIBLE_API_KEY") ?? "not-required";
      return { model: createOpenAI({ apiKey, baseURL, name: "compatible" })(modelId) };
    }
    default: {
      const apiKey = request.apiKey ?? envKey("AI_GATEWAY_API_KEY", "VERCEL_OIDC_TOKEN");
      if (!apiKey) {
        return {
          error:
            "The AI Gateway is not configured. Add AI_GATEWAY_API_KEY to .env.local, or choose a provider and paste a key in settings.",
        };
      }
      return { model: createGateway({ apiKey, baseURL: request.baseURL })(modelId) };
    }
  }
}
