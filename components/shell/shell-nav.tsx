"use client";

// THE NAV. One component, mounted twice: as the persistent rail at md and up,
// and as the body of the phone slide-over. Two renderings of a nav that drift
// apart is a navigation bug you only notice on one breakpoint — the retired
// shell had a desktop tab strip AND a phone bottom bar AND a "Lainnya" sheet,
// three lists to keep in agreement.
//
// It is a CLIENT component for exactly two reasons: it needs `usePathname` for
// active state, and the account section needs a session. Everything the server
// knows arrives as plain strings and booleans — never the tab list itself,
// whose `href` members are functions and cannot cross the boundary.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import type { Id } from "@convex/_generated/dataModel";
import { isCommunityTabActive } from "@/components/community/tab-active";
import { visibleCommunityTabs, type TenantTabSignal } from "@/lib/community";
import { cn } from "@/lib/utils";
import { NavLink, NavSection } from "./nav-link";
import { ShellAccountNav } from "./shell-account-nav";
import { ShellAction } from "./shell-action";
import { communityToolLinks, iconFor, isPathActive, KOMUNITAS_LINK } from "./nav-model";

export type ShellNavProps = {
  slug: string;
  name: string;
  tenantId: Id<"tenants">;
  /** "12 anggota · 5 kelas". null when the stats read failed. */
  memberLabel?: string | null;
  /**
   * Three plain booleans from the server. DATA-DRIVEN HIDING LIVES HERE: the
   * rows come from `visibleCommunityTabs(signal)`, so a community with no
   * published skill has no Skills row and no event has no Kalender row, exactly
   * as the old strip behaved. Omitted → every destination shows (fail open); a
   * failed read must never make a route vanish from the navigation.
   */
  signal?: TenantTabSignal;
  /** Closes the phone slide-over. Absent in the persistent rail. */
  onNavigate?: () => void;
  className?: string;
};

export function ShellNav({
  slug,
  name,
  tenantId,
  memberLabel,
  signal,
  onNavigate,
  className,
}: ShellNavProps) {
  const pathname = usePathname();
  const tools = communityToolLinks(slug);

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", className)}>
      {/* ── The community. Who you are inside, and the way back out. ── */}
      <div className="shrink-0 space-y-2 border-b-2 px-4 pb-4">
        <Link
          href={KOMUNITAS_LINK.href}
          onClick={onNavigate}
          className="pixel-press -ml-1 inline-flex min-h-11 items-center gap-1 pr-2 text-caption text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-3.5 shrink-0" aria-hidden />
          {KOMUNITAS_LINK.label}
        </Link>
        {/* Not an <h1>: the page's heading is server-rendered in the content
            column (app/k/[slug]/layout.tsx). This is the rail's identity, and
            two <h1>s that say the same thing is one too many. line-clamp-2
            because Press Start 2P is ~2x the advance width of the body face and
            a long community name would otherwise push the whole rail wide. */}
        <p className="line-clamp-2 font-display text-marquee uppercase [overflow-wrap:anywhere]">
          {name}
        </p>
        {memberLabel ? (
          <p className="text-caption text-muted-foreground">{memberLabel}</p>
        ) : null}
        <ShellAction tenantId={tenantId} slug={slug} variant="rail" onNavigate={onNavigate} />
      </div>

      {/* ── Its destinations, then the account. Scrolls; the block above does
             not, so the join CTA and the way out are always reachable. ── */}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-2 pb-[calc(var(--safe-b)+1rem)]">
        <NavSection label="Bagian komunitas">
          {visibleCommunityTabs(signal).map((tab) => (
            <li key={tab.key}>
              <NavLink
                href={tab.href(slug)}
                label={tab.label}
                icon={iconFor(tab.key)}
                active={isCommunityTabActive(tab, slug, pathname)}
                onNavigate={onNavigate}
              />
            </li>
          ))}
          {tools.map((link) => (
            <li key={link.key}>
              <NavLink
                href={link.href}
                label={link.label}
                icon={link.icon}
                active={isPathActive(link.href, pathname, link.exact)}
                onNavigate={onNavigate}
              />
            </li>
          ))}
        </NavSection>
        <ShellAccountNav onNavigate={onNavigate} />
      </div>
    </div>
  );
}
