"use client";

// THE one membership-aware control of the shell. A client island inside a
// server layout, because server components under /k are permanently ANONYMOUS
// (ConvexAuthProvider keeps its tokens in localStorage, proxy.ts is a stub), so
// "am I a member here" only resolves in the browser.
//
// WHO SEES WHAT — one primary action per person, not per screen:
//   stranger / logged out → GABUNG. The only thing this app is asking of
//     someone who has not joined, in coin gold, always above the fold.
//   member                → nothing in the rail (the rail already lists every
//     destination) and Cari in the phone bar, where there is no room for a list.
//   instructor / owner    → Kelola. Below md the rail is behind a tap, so the
//     bar keeps a direct way into the console.
//
// It renders a SKELETON of its own footprint while auth resolves — the same
// shape the old nav bar used, and the reason the "SSR anonymous → hydrated
// member" swap was never the glitch the owner reported.
import Link from "next/link";
import { Search, type LucideIcon } from "lucide-react";
import { kelolaLink } from "./nav-model";
import type { Id } from "@convex/_generated/dataModel";
import { JoinButton, useMyMembership } from "@/features/tenants";
import { Skeleton } from "@/components/ui/skeleton";
import { communityHref } from "@/lib/community";
import { SidebarMenuButton } from "./sidebar-menu";

/** `bar` = the phone top bar (exactly one 44px control).
 *  `rail` = the sidebar's community block (full width, or nothing). */
export type ShellActionVariant = "bar" | "rail";

function BarIconLink({
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
      // size-11 = 44px square. Quiet on purpose: chrome recedes, the content
      // is the interface.
      className="pixel-press inline-flex size-11 shrink-0 items-center justify-center text-muted-foreground hover:text-foreground"
    >
      <Icon className="size-5" aria-hidden />
    </Link>
  );
}

export function ShellAction({
  tenantId,
  slug,
  variant,
  onNavigate,
}: {
  tenantId: Id<"tenants">;
  slug: string;
  variant: ShellActionVariant;
  onNavigate?: () => void;
}) {
  const { membership, isAuthenticated, isAuthLoading } = useMyMembership(tenantId);
  const isBar = variant === "bar";

  // Same footprint as whatever it resolves into, so the bar never reflows.
  if (isAuthLoading || (isAuthenticated && membership === undefined)) {
    return <Skeleton className={isBar ? "h-11 w-24" : "h-11 w-full"} />;
  }

  if (membership) {
    if (membership.role !== "owner" && membership.role !== "instructor") {
      // A plain member: the rail already lists every destination, so it gets
      // no action at all. The bar has no list, so it keeps Cari.
      return isBar ? (
        <BarIconLink
          href={communityHref.cari(slug)}
          label="Cari kelas & materi"
          icon={Search}
        />
      ) : null;
    }
    // Href, label and icon come from nav-model so the rail and this action can
    // never drift into naming the same destination two different ways — the
    // drift the nav-model header argues against, and which this file was
    // quietly committing by rebuilding the link inline.
    // The RAIL's Kelola moved into SidebarQuickRow, beside Beranda — rendering
    // it here too would put the same destination in the sidebar twice. The bar
    // keeps it: below md the rail is behind a tap.
    const kelola = kelolaLink(slug);
    return isBar ? (
      <BarIconLink href={kelola.href} label="Kelola komunitas" icon={kelola.icon} />
    ) : null;
  }

  return (
    <JoinButton
      tenantId={tenantId}
      loginHref={`/masuk?next=${encodeURIComponent(communityHref.home(slug))}`}
      // One word. "Login untuk gabung" is the same promise at three times the
      // width; logging in is a detail of HOW you join, not a different action.
      labels={{ cta: "Gabung", loginFirst: "Gabung" }}
      className={isBar ? "h-11 px-4 text-xs" : "h-11 w-full"}
    />
  );
}
