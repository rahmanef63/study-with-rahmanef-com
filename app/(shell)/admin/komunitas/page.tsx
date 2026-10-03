"use client";

import { AdminTenantQueueView } from "@/features/tenants";

// #6 mount — antrian approval (server authz = requirePlatformAdmin; the view
// shows its own denied state for non-admins).
export default function AdminKomunitasPage() {
  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold">Komunitas</h1>
      <AdminTenantQueueView />
    </section>
  );
}
