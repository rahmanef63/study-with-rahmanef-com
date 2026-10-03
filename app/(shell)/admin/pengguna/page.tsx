"use client";
import { PlatformUsersView } from "@/features/analytics";
import { communityHref } from "@/lib/community";
export default function AdminUsersPage() {
  return <section className="space-y-6"><header><h1 className="text-2xl font-semibold">Pengguna</h1><p className="mt-2 text-sm text-muted-foreground">Akun terdaftar, aktivitas terakhir, dan status belajar. Buka akun untuk melihat progres serta sumber kunjungannya.</p></header><PlatformUsersView enabled detailHref={communityHref.adminUserDetail} /></section>;
}
