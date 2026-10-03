import { createHash } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { CAPABILITIES, capabilityDescriptor } from "../convex/features/mcp/capabilities";

export type McpScope = "user" | "admin";
export type McpBackend = {
  authenticate: (token: string, scope: McpScope) => Promise<unknown>;
  discover: (token: string, scope: McpScope) => Promise<unknown>;
  execute: (token: string, scope: McpScope, capability: string, args: Record<string, unknown>) => Promise<{ resultJson: string }>;
};
export function mcpToolsetSignature(scope: McpScope) {
  return createHash("sha256").update(JSON.stringify({ version: "1.0.0", scope, capabilities: CAPABILITIES.filter(c => c.scope === scope).map(capabilityDescriptor) })).digest("hex");
}
export function makeMcpServer(scope: McpScope, token: string, backend: McpBackend) {
  const signature = mcpToolsetSignature(scope);
  const server = new McpServer({ name: `study-${scope}`, version: "1.0.0" }, { instructions: "Discover capabilities first. Use their input schemas and current permissions. Obtain explicit user direction before writes; never claim reading proves lesson completion. Refresh tools/list after reconnecting or a toolset signature change." });
  const _meta = { "study/scope": scope, "study/toolsetSignature": signature };
  server.registerTool("capabilities_list", {
    description: `Discover bounded Study ${scope} capabilities, input schemas, permission limits and effects.`,
    inputSchema: z.object({}).strict(), annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }, _meta,
  }, async () => {
    try {
      const capabilities = await backend.discover(token, scope);
      return { content: [{ type: "text", text: JSON.stringify({ scope, toolsetSignature: signature, capabilities }) }] };
    } catch {
      return { isError: true, content: [{ type: "text", text: "Discovery gagal. Periksa token dan izin akun saat ini." }] };
    }
  });
  const names = CAPABILITIES.filter(c => c.scope === scope).map(c => c.id);
  server.registerTool("capability_execute", {
    description: `Execute one discovered ${scope} capability with its declared arguments. Mutations have effects described by discovery.`,
    inputSchema: z.object({ capability: z.enum(names as [string, ...string[]]), arguments: z.record(z.string(), z.unknown()) }).strict(),
    annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: false }, _meta,
  }, async ({ capability, arguments: args }) => {
    try {
      const result = await backend.execute(token, scope, capability, args);
      return { content: [{ type: "text", text: result.resultJson }] };
    } catch {
      return { isError: true, content: [{ type: "text", text: "Capability gagal. Periksa schema argumen, masa berlaku token, dan izin akun saat ini." }] };
    }
  });
  return server;
}
