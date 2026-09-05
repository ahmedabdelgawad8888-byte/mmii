import { convertToModelMessages, stepCountIs, streamText, type ToolSet, tool, type UIMessage } from "ai";

import { agentTools } from "@/app/(main)/dashboard/agent/_components/agent-tools";
import { type ModelRequest, resolveAgentModel } from "@/lib/agent-model";

interface ChatRequest extends ModelRequest {
  messages: UIMessage[];
  system?: string;
}

export const maxDuration = 60;

/**
 * Thin one-turn proxy. Tools are declared without `execute` so every call is
 * forwarded to the browser, where the workspace actually lives.
 */
const forwardedTools: ToolSet = Object.fromEntries(
  Object.entries(agentTools).map(([name, spec]) => [
    name,
    // Each schema has a distinct shape, so the map widens to a union that the
    // generic cannot infer; the runtime value is a valid tool either way.
    tool({ description: spec.description, inputSchema: spec.inputSchema as never }),
  ]),
);

export async function POST(req: Request) {
  let body: ChatRequest;
  try {
    body = (await req.json()) as ChatRequest;
  } catch {
    return Response.json({ error: "Malformed request body." }, { status: 400 });
  }

  if (!Array.isArray(body.messages)) {
    return Response.json({ error: "No messages supplied." }, { status: 400 });
  }

  const resolved = resolveAgentModel(body);
  if ("error" in resolved) {
    return Response.json({ error: resolved.error, ready: resolved.ready }, { status: 400 });
  }

  try {
    const result = streamText({
      model: resolved.model,
      system: body.system,
      messages: await convertToModelMessages(body.messages),
      tools: forwardedTools,
      // Every tool round-trips through the browser, so the loop advances one
      // client execution at a time; this caps a runaway chain.
      stopWhen: stepCountIs(12),
    });

    return result.toUIMessageStreamResponse({
      onError: (error) => (error instanceof Error ? error.message : "The model request failed."),
      headers: {
        "x-agent-provider": resolved.providerId,
        "x-agent-model": resolved.modelId,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "The model request failed.";
    return Response.json({ error: message }, { status: 502 });
  }
}
