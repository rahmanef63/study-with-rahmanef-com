"use client";

// Membership gate around SearchView — the search queries are
// requireTenantRole(member), so a stranger would get NOT_AUTHORIZED thrown into
// app/error.tsx. Same shape as lesson-surface / kuis-surface.
//
// onNavigate is omitted deliberately: the seam existed so the OS could turn a
// result into openWindow(). SearchView falls back to next/link, which is what
// we want now that hits are real routes.
import type { Id } from "@convex/_generated/dataModel";
import { SearchView } from "@/features/search";
import { useMyMembership, useTenantBySlug } from "@/features/tenants";
import { Skeleton } from "@/components/ui/skeleton";
import { GabungDulu } from "../_components/gabung-dulu";
import { communityHref } from "@/lib/community";

function CariSkeleton() {
  return (
    <div className="space-y-3" aria-busy>
      <span className="sr-only">Memuat pencarian…</span>
      <Skeleton className="h-11 w-full rounded-md" />
      <Skeleton className="h-14 w-full rounded-md" />
      <Skeleton className="h-14 w-full rounded-md" />
    </div>
  );
}

function CariBody({ tenantId, slug }: { tenantId: Id<"tenants">; slug: string }) {
  const { membership, isAuthenticated, isAuthLoading } = useMyMembership(tenantId);

  if (isAuthLoading || (isAuthenticated && membership === undefined)) return <CariSkeleton />;
  if (!membership) {
    return (
      <GabungDulu
        tenantId={tenantId}
        nextHref={communityHref.cari(slug)}
        title="Pencarian untuk anggota"
        description="Gabung komunitasnya dulu — gratis — lalu semua kelas dan materinya bisa dicari."
      />
    );
  }
  return <SearchView tenantId={tenantId} tenantSlug={slug} />;
}

export function CariSurface({ slug }: { slug: string }) {
  const tenant = useTenantBySlug(slug);
  if (tenant === undefined) return <CariSkeleton />;
  if (tenant === null) return null; // unknown community — the layout already 404s
  return <CariBody tenantId={tenant._id} slug={slug} />;
}
