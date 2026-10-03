"use client";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { PlatformTrafficView } from "@/features/analytics";

export default function AdminVisitorsPage() {
  return (
    <section className="space-y-6">
      <AdminPageHeader
        title="Pengunjung"
        description="Kunjungan halaman publik, sumber trafik, dan campaign. Sesi tidak sama dengan orang."
      />
      <PlatformTrafficView enabled />
    </section>
  );
}
