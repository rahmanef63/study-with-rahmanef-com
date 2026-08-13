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
import { communityToolLinks, iconFor, isPathActive, KOMUNITAS_LINK,
  EXPLORE_LINKS,
  type ShellLink,
} from "./nav-model";

/** The community this rail is inside, when it is inside one. */
export type ShellCommunity = {
  slug: string;
  name: string;
  tenantId: Id<"tenants">;
  /** "12 anggota · 5 kelas". null when the stats read failed. */
  memberLabel?: string | null;
  /**
   * Three plain booleans from the server. DATA-DRIVEN HIDING LIVES HERE: the
   * rows come from `visibleCommunityTabs(signal)`, so a community with no
   * published skill has no Skills row and no event has no Kalender row.
   * Omitted → every destination shows (fail open); a failed read must never
   * make a route vanish from the navigation.
   */
  signal?: TenantTabSignal;
};

export type ShellNavProps = {
  /** Absent on the account surfaces — the rail is the same rail either way. */
  community?: ShellCommunity;
  /** Closes the phone slide-over. Absent in the persistent rail. */
  onNavigate?: () => void;
  className?: string;
};

export function ShellNav({ community, onNavigate, className }: ShellNavProps) {
  const pathname = usePathname();

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", className)}>
      {/* ── Where you are. Inside a community that is its identity and the way
             back out; outside one the brand IS the way in, since "/" redirects
             to the flagship. One block, two fillings — this used to be two
             components with two headers, which is what made the app look like
             it had two different sidebars depending on the page. ── */}
      <div className="shrink-0 space-y-2 border-b-2 px-4 pb-4">
        {community === undefined ? (
          <Link
            href="/"
            onClick={onNavigate}
            className="pixel-press -ml-1 inline-flex min-h-11 items-center px-1 font-display text-marquee uppercase hover:text-primary"
          >
            Belajar
          </Link>
        ) : (
          <>
            <Link
              href={KOMUNITAS_LINK.href}
              onClick={onNavigate}
              className="pixel-press -ml-1 inline-flex min-h-11 items-center gap-1 pr-2 text-caption text-muted-foreground hover:text-foreground md:min-h-8"
            >
              <ChevronLeft className="size-3.5 shrink-0" aria-hidden />
              {KOMUNITAS_LINK.label}
            </Link>
            {/* Not an <h1>: the page's heading is server-rendered in the content
                column. line-clamp-2 because Press Start 2P is ~2x the advance
                width of the body face. */}
            <p className="line-clamp-2 font-display text-marquee uppercase [overflow-wrap:anywhere]">
              {community.name}
            </p>
            {community.memberLabel ? (
              <p className="text-caption text-muted-foreground">{community.memberLabel}</p>
            ) : null}
            <ShellAction
              tenantId={community.tenantId}
              slug={community.slug}
              variant="rail"
              onNavigate={onNavigate}
            />
          </>
        )}
      </div>

      {/* ONE <nav>. The groups inside are groups, not landmarks — see NavSection. */}
      {/* `flex flex-col` exists for one reason: it lets the account group take
          `mt-auto` and sit on the rail's floor. Without it the rail rendered its
          last group mid-height with ~210px of dead space underneath — measured
          at 1280x900, signed out — which reads as an unfinished panel rather
          than a deliberate one. Account-at-the-bottom is also where a decade of
          dashboards has taught people to reach for it.

          It still degrades correctly: when the rows DO overflow (a community
          with every tab, signed in), `mt-auto` simply has nothing to distribute
          and the group falls back to flowing after the one above it. */}
      <nav
        aria-label="Navigasi"
        className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain py-2 pb-[calc(var(--safe-b)+1rem)]"
      >
        {community === undefined ? null : (
          <NavSection label="Bagian komunitas">
            {visibleCommunityTabs(community.signal).map((tab) => (
              <li key={tab.key}>
                <NavLink
                  href={tab.href(community.slug)}
                  label={tab.label}
                  icon={iconFor(tab.key)}
                  active={isCommunityTabActive(tab, community.slug, pathname)}
                  onNavigate={onNavigate}
                />
              </li>
            ))}
            {communityToolLinks(community.slug).map((link: ShellLink) => (
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
        )}

        {/* Reachable from EVERYWHERE, which is the point of one rail: the
            roadmap and the assessment used to exist only inside a community,
            so a reader on /pengaturan could not get to them at all. */}
        <NavSection label="Jelajah" heading={community === undefined ? undefined : "Jelajah"}>
          {(community === undefined
            ? [{ ...KOMUNITAS_LINK, label: "Komunitas" }, ...EXPLORE_LINKS]
            : EXPLORE_LINKS
          ).map((link) => (
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
      </nav>
    </div>
  );
}
