"use client";

// Auth-aware bits of the community header. A CLIENT island inside a SERVER
// layout: server components here are permanently anonymous (ConvexAuthProvider
// keeps its tokens in localStorage and proxy.ts is a pass-through), so
// membership and role can only be resolved in the browser.
import Link from "next/link";
import { SlidersHorizontal } from "lucide-react";
import type { Id } from "@convex/_generated/dataModel";
import { JoinButton, useMyMembership } from "@/features/tenants";
import { TombolBagikan } from "@/components/tombol-bagikan";
import { communityHref } from "@/lib/community";
import { absoluteUrl } from "@/lib/site";

export function CommunityActions({
  tenantId,
  slug,
  name,
}: {
  tenantId: Id<"tenants">;
  slug: string;
  name: string;
}) {
  const { membership } = useMyMembership(tenantId);
  const canManage = membership?.role === "instructor" || membership?.role === "owner";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <JoinButton tenantId={tenantId} loginHref={`/masuk?next=${encodeURIComponent(communityHref.home(slug))}`} />
      <TombolBagikan url={absoluteUrl(communityHref.home(slug))} title={name} variant="ghost" />
      {canManage ? (
        <Link
          href={communityHref.kelola(slug)}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <SlidersHorizontal className="size-3.5" aria-hidden />
          Kelola
        </Link>
      ) : null}
    </div>
  );
}
