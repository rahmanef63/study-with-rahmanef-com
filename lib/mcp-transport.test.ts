// @vitest-environment node
import { test, expect, vi } from "vitest";
import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";
import { serveMcp } from "./mcp-transport";
import { mcpToolsetSignature, type McpBackend, type McpScope } from "./mcp-server";

const token = (scope: McpScope) => `study_mcp_${scope}_${"a".repeat(64)}`;
function backend(): McpBackend {
  return { authenticate: vi.fn(async () => ({})), discover: vi.fn(async (_token, scope) => [{ id: `${scope}.example`, readOnly: true }]), execute: vi.fn(async () => ({ resultJson: '{"verified":true}' })) };
}
async function connect(scope: McpScope, host: McpBackend, modern = false) {
  const client = new Client({ name: "study-contract-test", version: "1.0.0" }, modern ? { versionNegotiation: { mode: "auto" } } : {});
  const transport = new StreamableHTTPClientTransport(new URL(`http://localhost/api/mcp/${scope}`), {
    requestInit: { headers: { authorization: `Bearer ${token(scope)}` } },
    fetch: (input, init) => serveMcp(new Request(input, init), scope, host),
  });
  await client.connect(transport);
  return client;
}
test.each([false, true])("official SDK client negotiates handshake and refreshed scoped toolset (modern=%s)", async modern => {
  for (const scope of ["user", "admin"] as const) {
    const host = backend();
    const client = await connect(scope, host, modern);
    try {
      expect(client.getServerVersion()?.name).toBe(`study-${scope}`);
      const first = await client.listTools();
      const refreshed = await client.listTools();
      expect(refreshed.tools).toEqual(first.tools);
      expect(first.tools.map(tool => tool.name)).toEqual(["capabilities_list", "capability_execute"]);
      expect(first.tools.every(tool => tool._meta?.["study/toolsetSignature"] === mcpToolsetSignature(scope))).toBe(true);
      expect(first.tools[0].annotations?.readOnlyHint).toBe(true);
      expect(first.tools[1].annotations?.destructiveHint).toBe(true);
      const discovery = await client.callTool({ name: "capabilities_list", arguments: {} });
      expect(JSON.stringify(discovery)).toContain(`${scope}.example`);
      const capability = scope === "user" ? "user.profile" : "admin.learning_analytics";
      const result = await client.callTool({ name: "capability_execute", arguments: { capability, arguments: scope === "user" ? {} : { days: 30 } } });
      expect(JSON.stringify(result)).toContain("verified");
      expect(host.execute).toHaveBeenCalledWith(token(scope), scope, capability, scope === "user" ? {} : { days: 30 });
      await client.callTool({ name: "capability_execute", arguments: { capability: scope === "user" ? "admin.learning_analytics" : "user.profile", arguments: {} } });
      expect(host.execute).toHaveBeenCalledTimes(1);
    } finally { await client.close(); }
  }
});
test("host/origin, malformed and wrong-scope tokens deny before backend calls", async () => {
  const host = backend();
  for (const [url, headers, status] of [
    ["https://evil.example/api/mcp/user", {}, 403],
    ["http://localhost/api/mcp/user", { origin: "https://evil.example" }, 403],
    ["http://localhost/api/mcp/user", {}, 401],
    ["http://localhost/api/mcp/user", { authorization: `Bearer ${token("admin")}` }, 403],
  ] as const) expect((await serveMcp(new Request(url, { method: "POST", headers }), "user", host)).status).toBe(status);
  expect(host.authenticate).not.toHaveBeenCalled();
});
test("body limit rejects dishonest length before protocol execution", async () => {
  const host = backend();
  const response = await serveMcp(new Request("http://localhost/api/mcp/user", { method: "POST", headers: { authorization: `Bearer ${token("user")}`, "content-type": "application/json", accept: "application/json, text/event-stream", "content-length": "1" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "capability_execute", arguments: { capability: "user.profile", arguments: { junk: "x".repeat(17000) } } } }) }), "user", host);
  expect(response.status).toBe(413);
  expect(host.execute).not.toHaveBeenCalled();
});
test("revocation is checked on the next client call; backend errors never echo credentials", async () => {
  const host = backend();
  const client = await connect("user", host);
  try {
    vi.mocked(host.discover).mockRejectedValueOnce(new Error(token("user")));
    const response = await client.callTool({ name: "capabilities_list", arguments: {} });
    expect(response.isError).toBe(true);
    expect(JSON.stringify(response)).not.toContain(token("user"));
    vi.mocked(host.authenticate).mockRejectedValue(new Error("revoked"));
    await expect(client.listTools()).rejects.toThrow();
  } finally { await client.close(); }
});
test("standalone proxy-shaped requests reach protocol authentication and initialize", async () => {
  const headers = { host: "study-with.rahmanef.com", "content-type": "application/json", accept: "application/json, text/event-stream" };
  expect((await serveMcp(new Request("http://0.0.0.0:3000/api/mcp/user", { method: "POST", headers }), "user", backend())).status).toBe(401);
  const host = backend();
  const response = await serveMcp(new Request("http://0.0.0.0:3000/api/mcp/user", { method: "POST", headers: { ...headers, authorization: `Bearer ${token("user")}` }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-11-25", capabilities: {}, clientInfo: { name: "proxy-test", version: "1.0.0" } } }) }), "user", host);
  expect(response.status).toBe(200);
  expect(await response.text()).toContain("study-user");
  expect(host.authenticate).toHaveBeenCalledTimes(1);
});
