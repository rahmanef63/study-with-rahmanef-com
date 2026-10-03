import { McpAccessView } from "@/components/mcp/mcp-access-view";
export default function AdminMcpPage() {
  return <section className="space-y-6"><header><h1 className="text-2xl font-semibold">MCP admin</h1><p className="mt-2 text-sm text-muted-foreground">Akses analitik dan pengelolaan platform dari asisten melalui token admin milik Anda.</p></header><McpAccessView scope="admin" /></section>;
}
