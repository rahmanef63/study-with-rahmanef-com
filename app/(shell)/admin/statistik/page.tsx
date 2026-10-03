"use client";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { PlatformAnalyticsView } from "@/features/analytics";

export default function AdminStatisticsPage() {
  return (
    <section className="space-y-6">
      <AdminPageHeader
        title="Statistik belajar"
        description="Aktivitas anggota dan perkembangan seluruh komunitas di Study."
      />
      <PlatformAnalyticsView enabled />
    </section>
  );
}
