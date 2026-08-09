"use client";

// The single "this is members-only" state, shared by Diskusi and Anggota.
//
// Every read behind those tabs is requireTenantRole(member) server-side, so
// rendering their views to a stranger surfaces a NOT_AUTHORIZED throw through
// convex/react into app/error.tsx — the OS shell shipped exactly that bug on
// /pengumuman. Gate first, invite second.
import type { Id } from "@convex/_generated/dataModel";
import { Users } from "lucide-react";
import { JoinButton } from "@/features/tenants";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export function GabungDulu({
  tenantId,
  nextHref,
  title,
  description,
}: {
  tenantId: Id<"tenants">;
  /** Where login returns to — the tab the visitor actually wanted. */
  nextHref: string;
  title: string;
  description: string;
}) {
  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Users aria-hidden />
        </EmptyMedia>
        <EmptyTitle className="font-serif">{title}</EmptyTitle>
        <EmptyDescription className="text-pretty">{description}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        {/* JoinButton already renders the right affordance for all three states
            (logged out → login link, non-member → join, member → role chip). */}
        <JoinButton
          tenantId={tenantId}
          loginHref={`/masuk?next=${encodeURIComponent(nextHref)}`}
        />
      </EmptyContent>
    </Empty>
  );
}
