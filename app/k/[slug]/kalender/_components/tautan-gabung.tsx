"use client";

// Kalender — the member-only join link.
//
// The list above is server-rendered and therefore ANONYMOUS, so its projection
// always carries locationUrl: null (see convex/features/events/projections.ts).
// This island re-reads the SAME whitelisted query over the authenticated socket:
// a member gets the real link, everyone else gets a join CTA. Every instance on
// the page shares one Convex subscription (same function, same args), so N
// sessions still cost one round trip — and the list becomes live as a bonus.
//
// Three outcomes, never a fourth: real link · "gabung dulu" · nothing (when the
// session genuinely has no link). It must never render a dead href, and it must
// never tell a non-member that there is no session link when there is one.
import { useConvexAuth, useQuery } from "convex/react";
import { ExternalLink } from "lucide-react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { JoinButton } from "@/features/tenants";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { kalenderHref } from "./acara-lib";

export function TautanGabung({
  tenantId,
  slug,
  eventId,
  hasLocation,
  lampau = false,
}: {
  tenantId: Id<"tenants">;
  slug: string;
  eventId: Id<"events">;
  /** From the server projection: a link EXISTS, we just may not be shown it. */
  hasLocation: boolean;
  /** Read the archive query instead of the upcoming one. */
  lampau?: boolean;
}) {
  const { isAuthenticated } = useConvexAuth();
  const baris = useQuery(
    lampau
      ? api.features.events.queries.publicListPast
      : api.features.events.queries.publicListUpcoming,
    { tenantId }
  );

  if (!hasLocation) return null;

  const url = baris?.find((row) => row._id === eventId)?.locationUrl ?? null;
  if (url !== null) {
    return (
      <Button asChild size="sm" className="min-h-11 gap-1.5 @sm:min-h-9">
        <a href={url} target="_blank" rel="noopener noreferrer">
          {lampau ? "Buka rekaman" : "Buka link sesi"}
          <ExternalLink aria-hidden className="size-3.5" />
        </a>
      </Button>
    );
  }

  // Signed in but the member-aware read has not landed yet — hold the space
  // rather than flash "gabung dulu" at somebody who already joined.
  if (isAuthenticated && baris === undefined) return <Skeleton className="h-9 w-44" />;

  return (
    <JoinButton
      tenantId={tenantId}
      loginHref={`/masuk?next=${encodeURIComponent(kalenderHref(slug))}`}
      labels={{
        cta: "Gabung untuk dapat link",
        loginFirst: "Gabung untuk dapat link",
      }}
      // Width matters: JoinButton reuses this class on its own auth-loading
      // skeleton, which would otherwise collapse to zero.
      className="min-h-11 w-44 @sm:min-h-9"
    />
  );
}
