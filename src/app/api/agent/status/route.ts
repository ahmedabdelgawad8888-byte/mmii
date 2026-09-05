import { configuredProviders, type ModelRequest } from "@/lib/agent-model";

/**
 * Tells the interface which providers can actually answer, so the setup card
 * can name them instead of failing a request first. Reports availability only:
 * no key value is ever returned.
 */
export async function POST(req: Request) {
  let body: ModelRequest = {};
  try {
    body = (await req.json()) as ModelRequest;
  } catch {
    body = {};
  }
  const ready = configuredProviders(body);
  return Response.json({ ready, anyConfigured: ready.length > 0 });
}
