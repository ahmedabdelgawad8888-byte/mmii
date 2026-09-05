import { generateText } from "ai";

import { type ModelRequest, providerLabel, resolveAgentModel } from "@/lib/agent-model";

/**
 * Confirms a provider, model and key actually work together, using the
 * smallest possible completion. The key is never persisted or echoed back.
 */
export async function POST(req: Request) {
  let body: ModelRequest;
  try {
    body = (await req.json()) as ModelRequest;
  } catch {
    return Response.json({ ok: false, error: "Malformed request body." }, { status: 400 });
  }

  const resolved = resolveAgentModel({ ...body, allowFallback: body.allowFallback ?? false });
  if ("error" in resolved) {
    return Response.json({ ok: false, error: resolved.error });
  }

  try {
    const result = await generateText({
      model: resolved.model,
      prompt: "Reply with the single word: ready",
      maxOutputTokens: 16,
    });
    return Response.json({
      ok: true,
      providerId: resolved.providerId,
      modelId: resolved.modelId,
      viaFallback: resolved.viaFallback,
      message: resolved.viaFallback
        ? `${providerLabel(resolved.providerId)} answered with ${resolved.modelId}, because the selected provider has no key.`
        : `${resolved.modelId} responded.`,
      sample: result.text.trim().slice(0, 40),
    });
  } catch (error) {
    const raw = error instanceof Error ? error.message : "The provider rejected the request.";
    // Provider errors can embed the request payload; keep only the first line.
    return Response.json({ ok: false, error: raw.split("\n")[0].slice(0, 300) });
  }
}
