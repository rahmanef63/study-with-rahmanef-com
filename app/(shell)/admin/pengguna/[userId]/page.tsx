"use client";

import type { Id } from "@convex/_generated/dataModel";
import { use } from "react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { PlatformUserDetailView } from "@/features/analytics";

export default function AdminUserDetailPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params);
  return (
    <section className="space-y-6">
      <AdminPageHeader title="Aktivitas pengguna" />
      <PlatformUserDetailView enabled userId={userId as Id<"users">} geoAttributionHref="https://db-ip.com" />
    </section>
  );
}
