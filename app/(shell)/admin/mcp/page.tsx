"use client";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { McpAccessView } from "@/components/mcp/mcp-access-view";

export default function AdminMcpPage() {
  return (
    <section className="space-y-6">
      <AdminPageHeader
        title="MCP admin"
        description="Akses analitik dan pengelolaan platform dari asisten melalui token admin milik Anda."
      />
      <McpAccessView scope="admin" />
    </section>
  );
}
