"use client";
// Pengumuman — the OS "papan pengumuman" app: a community's announcements feed,
// the former /t/[slug]/pengumuman route folded into an appshell window. Resolves
// the tenant from the payload slug (the same query the route's useTenantBySlug
// wraps) and gates the instructor+ compose form on the caller's membership (UX
// only — the announcements create mutation re-checks the role server-side).
// Reuses the announcements slice's connected AnnouncementsView (feed + moderator
// compose form) — no reimplementation. Fetches client-side via useQuery like
// Beranda (the root layout already mounts Convex).
import { useQuery } from "convex/react";
import { type AppProps } from "@/features/appshell";
import { AnnouncementsView } from "@/features/announcements";
import { seg } from "./_nav";
import { tenantsApi, useMyMembership, type PublicTenant } from "@/features/tenants";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";

function PengumumanEmpty({ title, description }: { title: string; description: string }) {
  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyTitle className="font-serif">{title}</EmptyTitle>
        <EmptyDescription className="text-pretty">{description}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

export default function PengumumanApp(props: AppProps) {
  // Deep-link path: /pengumuman/<tenantSlug>
  const [slug] = seg(props.payload);

  // Public tenant lookup by slug — the same query the route's useTenantBySlug
  // wraps. `undefined` = loading, `null` = not found/inactive. Skip with no slug.
  const tenant = useQuery(
    tenantsApi.getPublicBySlug,
    slug ? { slug } : "skip",
  ) as PublicTenant | null | undefined;

  // Membership → canManage exactly like the route: instructor+ unlocks the
  // compose form (UX gate only; the create mutation re-checks the role
  // server-side). useMyMembership skips until authenticated so it never throws
  // NOT_AUTHENTICATED during the auth handshake.
  const { membership } = useMyMembership(tenant?._id);
  const canManage = membership?.role === "instructor" || membership?.role === "owner";

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8 p-6 sm:p-8">
      <header className="min-w-0 space-y-1">
        <span className="eyebrow">Pengumuman komunitas</span>
        {tenant ? (
          <p className="min-w-0 truncate font-serif text-2xl text-pretty sm:text-3xl">
            {tenant.name}
          </p>
        ) : null}
      </header>

      {!slug ? (
        <PengumumanEmpty
          title="Komunitas belum dipilih"
          description="Buka pengumuman ini dari sebuah komunitas untuk melihat kabarnya."
        />
      ) : tenant === undefined ? (
        <div className="space-y-4" aria-busy="true">
          <div className="h-28 w-full animate-pulse rounded-2xl bg-muted/50" />
          <div className="h-28 w-full animate-pulse rounded-2xl bg-muted/50" />
        </div>
      ) : tenant === null ? (
        <PengumumanEmpty
          title="Komunitas tidak ditemukan"
          description="Komunitas ini tidak aktif atau tautannya sudah tidak berlaku."
        />
      ) : (
        <div className="min-w-0">
          <AnnouncementsView tenantId={tenant._id} canManage={canManage} />
        </div>
      )}
    </div>
  );
}
