"use client";
import type { Id } from "@convex/_generated/dataModel";
import { use } from "react";
import Link from "next/link";
import { PlatformUserDetailView } from "@/features/analytics";
import { communityHref } from "@/lib/community";
export default function AdminUserDetailPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params);
  return <section className="space-y-6"><header><Link href={communityHref.adminUsers()} className="mb-3 inline-flex min-h-11 items-center text-sm text-muted-foreground hover:text-foreground">← Kembali ke pengguna</Link><h1 className="text-2xl font-semibold">Aktivitas pengguna</h1></header><PlatformUserDetailView enabled userId={userId as Id<"users">} geoAttributionHref="https://db-ip.com" /></section>;
}
