"use client";

import { AdminTenantQueueView } from "@/features/tenants";

// #6 mount — antrian approval (server authz = requirePlatformAdmin; the view
// shows its own denied state for non-admins).
export default function AdminKomunitasPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <AdminTenantQueueView />
    </div>
  );
}
