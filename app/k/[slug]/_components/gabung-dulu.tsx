"use client";

// The single "this is members-only" state, shared by Diskusi, Anggota and
// Peringkat.
//
// Every read behind those tabs is requireTenantRole(member) server-side, so
// rendering their views to a stranger surfaces a NOT_AUTHORIZED throw through
// convex/react into app/error.tsx — the OS shell shipped exactly that bug on
// /pengumuman. Gate first, invite second.
import type { Id } from "@convex/_generated/dataModel";
import { JoinButton } from "@/features/tenants";

export function GabungDulu({
  tenantId,
  nextHref,
  description,
}: {
  tenantId: Id<"tenants">;
  /** Where login returns to — the tab the visitor actually wanted. */
  nextHref: string;
  description: string;
}) {
  return (
    // No dashed frame, no icon, no two-line Press Start heading. A gated screen
    // in an app is a short sentence and one control, centred in the space it
    // would have filled — it does not draw a box around itself and explain in
    // prose why it will not show you anything.
    //
    // The action is `outline`: the sticky nav bar already carries the gold Join
    // on every phone page, and two coin-gold controls 150px apart meant neither
    // was the primary one.
    // The height came down from 40vh (337px of nothing on an 844px phone, with
    // the page's own header already above it) to a box that is merely roomy.
    // Still centred and still unboxed — the comment above is right about what a
    // gate should look like; it was only wrong about how much air it needs.
    <div className="flex flex-col items-center justify-center gap-4 px-6 py-14 text-center">
      <p className="max-w-xs text-pretty text-sm text-muted-foreground">{description}</p>
      <JoinButton
        tenantId={tenantId}
        variant="outline"
        loginHref={`/masuk?next=${encodeURIComponent(nextHref)}`}
      />
    </div>
  );
}
