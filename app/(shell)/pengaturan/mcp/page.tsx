import { McpAccessView } from "@/components/mcp/mcp-access-view";
export default function UserMcpPage() {
  return <section className="space-y-6"><header><h1 className="text-2xl font-semibold">MCP user</h1><p className="mt-2 text-sm text-muted-foreground">Hubungkan asisten dengan materi, progress, dan komentar sesuai keanggotaan Anda.</p></header><McpAccessView scope="user" /></section>;
}
