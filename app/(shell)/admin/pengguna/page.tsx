"use client";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { PlatformUsersView } from "@/features/analytics";
import { communityHref } from "@/lib/community";

export default function AdminUsersPage() {
  return (
    <section className="space-y-6">
      <AdminPageHeader
        title="Pengguna"
        description="Akun terdaftar, aktivitas terakhir, dan status belajar. Buka akun untuk melihat progres serta sumber kunjungannya."
      />
      <PlatformUsersView enabled detailHref={communityHref.adminUserDetail} />
    </section>
  );
}
