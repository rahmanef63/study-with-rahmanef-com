"use client";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminTenantQueueView } from "@/features/tenants";

// #6 mount — antrian approval (server authz = requirePlatformAdmin; the view
// shows its own denied state for non-admins). The header is a client island
// because the trail reads the pathname; the queue stays behind the same gate.
export default function AdminKomunitasPage() {
  return (
    <section className="space-y-6">
      <AdminPageHeader
        title="Komunitas"
        description="Permintaan pembukaan komunitas dan persetujuannya."
      />
      <AdminTenantQueueView />
    </section>
  );
}
