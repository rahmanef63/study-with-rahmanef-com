import { McpAccessView } from "@/components/mcp/mcp-access-view";
import { accountBreadcrumbs } from "@/components/shell/breadcrumb-model";
import { BreadcrumbTrail } from "@/components/shell/breadcrumb-trail";

export default function UserMcpPage() {
  return (
    <section className="space-y-6">
      <header className="space-y-3">
        <BreadcrumbTrail items={accountBreadcrumbs("/pengaturan/mcp")} />
        <h1 className="text-xl font-semibold tracking-tight lg:text-2xl">MCP user</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Hubungkan asisten dengan materi, progress, dan komentar sesuai keanggotaan Anda.</p>
      </header>
      <McpAccessView scope="user" />
    </section>
  );
}

