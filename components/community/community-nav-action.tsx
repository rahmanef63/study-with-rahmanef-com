"use client";

// THE trailing action of the phone nav bar. Exactly one control, chosen by who
// you are — because "one primary action per screen" is not a layout rule, it is
// a rule about the person looking at the screen:
//
//   stranger / logged out → GABUNG. The only thing this screen is asking of
//     someone who has not joined, in coin gold, permanently on top of the fold.
//   member                → Cari. The join CTA has done its job and must give
//     up prime real estate; search is the tool a member actually reaches for.
//   instructor / owner    → Kelola. Below md the tab strip is gone, so this is
//     the only way back into the console from a phone.
//
// A client island because server components under /k are permanently anonymous
// (AGENTS.md): membership only resolves in the browser.
import Link from "next/link";
import { Search, SlidersHorizontal, type LucideIcon } from "lucide-react";
import type { Id } from "@convex/_generated/dataModel";
import { JoinButton, useMyMembership } from "@/features/tenants";
import { Skeleton } from "@/components/ui/skeleton";
import { communityHref } from "@/lib/community";

function NavIconLink({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      // size-11 = 44px square. Quiet on purpose: chrome recedes, the courses
      // are the interface.
      className="pixel-press inline-flex size-11 items-center justify-center text-muted-foreground hover:text-foreground"
    >
      <Icon className="size-5" aria-hidden />
    </Link>
  );
}

export function CommunityNavAction({
  tenantId,
  slug,
}: {
  tenantId: Id<"tenants">;
  slug: string;
}) {
  const { membership, isAuthenticated, isAuthLoading } = useMyMembership(tenantId);

  // Same footprint as the button it resolves into, so the bar never reflows.
  if (isAuthLoading || (isAuthenticated && membership === undefined)) {
    return <Skeleton className="h-11 w-24" />;
  }

  if (membership) {
    return membership.role === "owner" || membership.role === "instructor" ? (
      <NavIconLink
        href={communityHref.kelola(slug)}
        label="Kelola komunitas"
        icon={SlidersHorizontal}
      />
    ) : (
      <NavIconLink href={communityHref.cari(slug)} label="Cari kelas & materi" icon={Search} />
    );
  }

  return (
    <JoinButton
      tenantId={tenantId}
      loginHref={`/masuk?next=${encodeURIComponent(communityHref.home(slug))}`}
      // One word in a 48px bar. "Login untuk gabung" is the same promise spelled
      // out at three times the width; the login step is a detail of HOW you
      // join, not a different action.
      labels={{ cta: "Gabung", loginFirst: "Gabung" }}
      // h-11 (44px) beats the slice's own `min-h-11 @sm:min-h-9` either way, so
      // the target stays 44px regardless of the container it lands in.
      className="h-11 px-4 text-xs"
    />
  );
}
