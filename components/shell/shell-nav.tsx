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
import type { Id } from "@convex/_generated/dataModel";
import { isCommunityTabActive } from "@/components/community/tab-active";
import { visibleCommunityTabs, type TenantTabSignal } from "@/lib/community";
import { cn } from "@/lib/utils";
import { SidebarContent, SidebarFooter, SidebarGroup, SidebarHeader } from "./sidebar";
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "./sidebar-menu";
import { SidebarSwitcher } from "./sidebar-switcher";
import { SidebarUser } from "./sidebar-user";
import { ShellAction } from "./shell-action";
import { communityToolLinks, EXPLORE_LINKS, iconFor, isPathActive, type ShellLink } from "./nav-model";

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
      {/* ── Where you are, and the way to somewhere else, in ONE row.
             This used to be four stacked things — a "‹ Komunitas lain" link, the
             name, the member count, then the action — 177px of chrome before the
             first destination, a fifth of a 900px viewport. The switcher folds
             the first three together and gives the directory a real affordance
             instead of a back-link that only pointed one way. ── */}
      <SidebarHeader>
        <SidebarSwitcher
          current={
            community === undefined
              ? undefined
              : {
                  slug: community.slug,
                  name: community.name,
                  memberLabel: community.memberLabel,
                }
          }
          onNavigate={onNavigate}
        />
        {community === undefined ? null : (
          <ShellAction
            tenantId={community.tenantId}
            slug={community.slug}
            variant="rail"
            onNavigate={onNavigate}
          />
        )}
      </SidebarHeader>

      {/* ONE <nav>, three regions. The landmark spans Content AND Footer
          because both hold navigation — splitting them into two <nav>s is what
          produced the "2 sidebar menu" report. The SCROLLER is Content alone,
          which is the whole reason for adopting shadcn's split: a footer inside
          the scroller is a footer that scrolls away, and the account rows are
          the ones a lost reader reaches for. */}
      <nav aria-label="Navigasi" className="flex min-h-0 flex-1 flex-col">
        <SidebarContent>
        {community === undefined ? null : (
          <SidebarGroup label="Bagian komunitas">
            <SidebarMenu>
            {visibleCommunityTabs(community.signal).map((tab) => (
              <SidebarMenuItem key={tab.key}>
                <SidebarMenuButton
                  href={tab.href(community.slug)}
                  label={tab.label}
                  icon={iconFor(tab.key)}
                  isActive={isCommunityTabActive(tab, community.slug, pathname)}
                  onNavigate={onNavigate}
                />
              </SidebarMenuItem>
            ))}
            {communityToolLinks(community.slug).map((link: ShellLink) => (
              <SidebarMenuItem key={link.key}>
                <SidebarMenuButton
                  href={link.href}
                  label={link.label}
                  icon={link.icon}
                  isActive={isPathActive(link.href, pathname, link.exact)}
                  onNavigate={onNavigate}
                />
              </SidebarMenuItem>
            ))}
            </SidebarMenu>
          </SidebarGroup>
        )}

          {/* THE STATIC HALF, and the rule above it is the whole point of the
              split. The group above changes shape with the tab signal — a
              community with no published skill has no Skills row — so the rail
              a reader sees is different in every community. These three never
              move, in or out of one, which makes them the part you can aim at
              from muscle memory.

              "Komunitas" belongs HERE and used to exist only as a back-link in
              the header, which meant the directory was reachable from the rail
              on the account pages and NOT from inside a community. Roadmap and
              Peta belajar had the opposite bug once: they lived only inside a
              community, so /pengaturan could not reach them at all. */}
          <SidebarGroup label="Jelajah" heading="Jelajah">
            <SidebarMenu>
              {EXPLORE_LINKS.map((link) => (
              <SidebarMenuItem key={link.key}>
                <SidebarMenuButton
                  href={link.href}
                  label={link.label}
                  icon={link.icon}
                  isActive={isPathActive(link.href, pathname, link.exact)}
                  onNavigate={onNavigate}
                />
              </SidebarMenuItem>
            ))}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <SidebarUser onNavigate={onNavigate} />
        </SidebarFooter>
      </nav>
    </div>
  );
}
