export const revalidate = 3600;

export interface AgentModelInfo {
  id: string;
  name: string;
  provider: string;
  contextWindow?: number;
  tags: string[];
}

interface CatalogueModel {
  id: string;
  name?: string;
  owned_by?: string;
  type?: string;
  context_window?: number;
  tags?: string[];
  supported_parameters?: string[];
}

/**
 * Each provider publishes an OpenAI-style catalogue, so the model list is
 * always live rather than a hardcoded set that goes stale. Proxied through the
 * server because most of these endpoints do not send CORS headers.
 */
const catalogues: Record<string, string> = {
  gateway: "https://ai-gateway.vercel.sh/v1/models",
  ollama: "https://ollama.com/v1/models",
  zen: "https://opencode.ai/zen/v1/models",
  qwen: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1/models",
};

/** Only the gateway advertises capabilities; elsewhere every listed model is offered. */
function isUsable(model: CatalogueModel, provider: string) {
  if (provider !== "gateway") return true;
  if (model.type !== "language") return false;
  return Boolean(model.tags?.includes("tool-use") || model.supported_parameters?.includes("tools"));
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const provider = url.searchParams.get("provider") ?? "gateway";
  const catalogue = catalogues[provider];

  if (!catalogue) {
    return Response.json({ models: [], error: "This provider does not publish a model catalogue." });
  }

  // A key is only needed for catalogues that refuse anonymous reads, such as
  // DashScope; the browser sends the one the visitor pasted, if any.
  const suppliedKey = request.headers.get("x-agent-key");
  const catalogueEnvVars: Record<string, string[]> = {
    qwen: ["DASHSCOPE_API_KEY", "QWEN_API_KEY"],
    ollama: ["OLLAMA_API_KEY"],
    zen: ["OPENCODE_ZEN_API_KEY"],
    gateway: ["AI_GATEWAY_API_KEY"],
  };
  const envFallback = (catalogueEnvVars[provider] ?? []).map((name) => process.env[name]).find(Boolean);
  const key = suppliedKey || envFallback;

  try {
    const response = await fetch(catalogue, {
      headers: { accept: "application/json", ...(key ? { authorization: `Bearer ${key}` } : {}) },
      next: { revalidate },
    });

    if (!response.ok) {
      return Response.json({
        models: [],
        error:
          response.status === 401
            ? "This catalogue needs an API key. Add one in settings to list models, or type the model id directly."
            : `Catalogue request failed (${response.status}).`,
      });
    }

    const payload = (await response.json()) as { data?: CatalogueModel[] };
    const models: AgentModelInfo[] = (payload.data ?? [])
      .filter((model) => isUsable(model, provider))
      .map((model) => ({
        id: model.id,
        name: model.name ?? model.id,
        provider: model.owned_by ?? model.id.split("/")[0],
        contextWindow: model.context_window,
        tags: model.tags ?? [],
      }))
      .sort((a, b) => a.provider.localeCompare(b.provider) || a.name.localeCompare(b.name));

    return Response.json({ models });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not reach the model catalogue.";
    return Response.json({ models: [], error: message });
  }
}
