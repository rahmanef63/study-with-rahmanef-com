"use client";

import { use } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { AnnouncementsView } from "@/features/announcements";
import { useMyMembership, useTenantBySlug } from "@/features/tenants";

// #10 mount — pengumuman komunitas (form buat = instructor+; UX gate saja,
// authz sesungguhnya di server).
export default function PengumumanPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const tenant = useTenantBySlug(slug);
  const { membership } = useMyMembership(tenant?._id);
  if (tenant === undefined) return <Skeleton className="mx-auto my-10 h-64 max-w-4xl" />;
  if (tenant === null) return null;
  const canManage = membership?.role === "instructor" || membership?.role === "owner";
  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <AnnouncementsView tenantId={tenant._id} canManage={canManage} />
    </div>
  );
}
