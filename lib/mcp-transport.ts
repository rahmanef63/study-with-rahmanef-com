import { createMcpHandler } from "@modelcontextprotocol/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@convex/_generated/api";
import { makeMcpServer, type McpBackend, type McpScope } from "./mcp-server";

function defaultBackend(): McpBackend | null {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) return null;
  const client = new ConvexHttpClient(url);
  return {
    authenticate: (token, scope) => client.action(api.features.mcp.bridge.authenticate, { token, scope }),
    discover: (token, scope) => client.action(api.features.mcp.bridge.discover, { token, scope }),
    execute: (token, scope, capability, args) => client.action(api.features.mcp.bridge.execute, { token, scope, capability, argumentsJson: JSON.stringify(args) }),
  };
}
/** Thin transport; all identity, scope, current-role and capability guards live in Convex. */
export async function serveMcp(request: Request, scope: McpScope, suppliedBackend?: McpBackend) {
  const url = new URL(request.url);
  const hosts = new Set(["study-with.rahmanef.com", "localhost", "127.0.0.1"]);
  if (!hosts.has(url.hostname)) return new Response(null, { status: 403 });
  const origin = request.headers.get("origin");
  if (origin && origin !== url.origin) return new Response(null, { status: 403 });
  const provided = request.headers.get("authorization") ?? "";
  const token = provided.startsWith("Bearer ") ? provided.slice(7) : "";
  if (!/^study_mcp_(user|admin)_[a-f0-9]{64}$/.test(token)) return new Response(null, { status: 401, headers: { "www-authenticate": 'Bearer realm="Study MCP"' } });
  if (!token.startsWith(`study_mcp_${scope}_`)) return new Response(null, { status: 403 });
  const backend = suppliedBackend ?? defaultBackend();
  if (!backend) return new Response(null, { status: 503 });
  try { await backend.authenticate(token, scope); }
  catch (error) {
    const data = error && typeof error === "object" && "data" in error ? error.data : null;
    const code = data && typeof data === "object" && "code" in data ? data.code : null;
    if (code === "RATE_LIMITED") return new Response(null, { status: 429, headers: { "retry-after": "60" } });
    if (code === "NOT_AUTHORIZED") return new Response(null, { status: 403 });
    return new Response(null, { status: 401, headers: { "www-authenticate": 'Bearer realm="Study MCP"' } });
  }
  // Per-request instances cannot retain tokens or permissions between calls.
  const handler = createMcpHandler(() => makeMcpServer(scope, token, backend), { responseMode: "json", maxRequestBodySize: 16_384, maxSubscriptions: 0 });
  const response = await handler.fetch(request);
  response.headers.set("cache-control", "no-store");
  return response;
}
