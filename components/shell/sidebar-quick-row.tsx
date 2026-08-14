"use client";

// Beranda, and Kelola beside it when the reader can manage this community.
//
// WHY IT IS A PAIR AND NOT TWO ROWS. Both are one-tap destinations a person
// aims at, not browses — the rail's list below is for browsing. Side by side
// they cost 44px instead of 88, which matters in a panel that was already
// overflowing a laptop two commits ago.
//
// Kelola used to render inside ShellAction's `rail` variant; it moved here so
// the sidebar names that destination exactly once. ShellAction keeps it for the
// phone top bar, where there is no rail to list it in.
//
// A client island for the reason everything membership-aware here is: the
// server has no session, so "can I manage this" only resolves in the browser.
// It renders the Beranda half immediately and only the Kelola half waits —
// holding BOTH behind the auth skeleton would make the home button flicker in
// on every navigation for a signal it does not depend on.
import { Home } from "lucide-react";
import type { Id } from "@convex/_generated/dataModel";
import { useMyMembership } from "@/features/tenants";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { HOME_LINK, isPathActive, kelolaLink } from "./nav-model";
import { SidebarMenuButton } from "./sidebar-menu";

const HALF = "min-w-0 flex-1 border-2 border-border justify-center gap-2 px-2";

export function SidebarQuickRow({
  tenantId,
  slug,
  pathname,
  onNavigate,
}: {
  /** Absent outside a community — Beranda then fills the row alone. */
  tenantId?: Id<"tenants">;
  slug?: string;
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex items-stretch gap-2">
      <SidebarMenuButton
        href={HOME_LINK.href}
        label={HOME_LINK.label}
        icon={Home}
        isActive={isPathActive(HOME_LINK.href, pathname, HOME_LINK.exact)}
        onNavigate={onNavigate}
        className={HALF}
      />
      {tenantId !== undefined && slug !== undefined ? (
        <KelolaHalf tenantId={tenantId} slug={slug} pathname={pathname} onNavigate={onNavigate} />
      ) : null}
    </div>
  );
}

function KelolaHalf({
  tenantId,
  slug,
  pathname,
  onNavigate,
}: {
  tenantId: Id<"tenants">;
  slug: string;
  pathname: string;
  onNavigate?: () => void;
}) {
  const { membership, isAuthenticated, isAuthLoading } = useMyMembership(tenantId);

  // Nothing at all while it resolves: a half-width skeleton beside Beranda
  // would promise a control that most readers never get, and then take it away.
  if (isAuthLoading || (isAuthenticated && membership === undefined)) {
    return <Skeleton className={cn(HALF, "h-11 border-0 md:h-9")} />;
  }
  if (!membership || (membership.role !== "owner" && membership.role !== "instructor")) return null;

  const kelola = kelolaLink(slug);
  return (
    <SidebarMenuButton
      href={kelola.href}
      label={kelola.label}
      icon={kelola.icon}
      isActive={isPathActive(kelola.href, pathname)}
      onNavigate={onNavigate}
      className={HALF}
    />
  );
}
