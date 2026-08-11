import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import {
  AppShell,
  ShellNav,
  ShellRailSkeleton,
  ShellDock,
  ShellTopBar,
  ShellTopBarSkeleton,
} from "@/components/shell";
import { absoluteUrl } from "@/lib/site";
import { communityHref } from "@/lib/community";
import { getStats, getTabSignal, getTenant } from "./_lib/tenant-reads";

// The community shell — a DASHBOARD SIDEBAR, owned by the layout.
//
// WHAT REPLACED WHAT. Gone: the desktop tab strip, the phone bottom bar and its
// "Lainnya" sheet, the brand row, and the 261px stacked header. In their place
// there is ONE nav (components/shell/shell-nav.tsx), rendered as a persistent
// rail at md and up and as a left slide-over below it. One list to keep
// correct instead of three.
//
// WHAT SURVIVED, deliberately:
//   · DATA-DRIVEN HIDING. The rows still come from `visibleCommunityTabs(
//     getTabSignal(slug))`, so belajar-ai still has no Kalender row. The signal
//     crosses the boundary as three plain booleans — never the tab list, whose
//     `href` members are functions (a function cannot cross server→client; it
//     has broken this app three times).
//   · A real <h1> in the server HTML of every page, `generateMetadata`, the
//     colocated OG cards, and the `@container` on <main> that every reused
//     slice sizes itself against.
//   · Every read is anonymous and memoised in ./_lib/tenant-reads.ts; anything
//     membership-aware is a client island.
type Params = { slug: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tenant = await getTenant(slug);
  if (tenant === null) return { title: "Komunitas tidak ditemukan", robots: { index: false } };
  return {
    title: { default: tenant.name, template: `%s — ${tenant.name}` },
    description: tenant.description,
    alternates: { canonical: communityHref.home(slug) },
    openGraph: {
      type: "website",
      title: tenant.name,
      description: tenant.description,
      url: absoluteUrl(communityHref.home(slug)),
      // No `images` here on purpose: the colocated opengraph-image.tsx supplies
      // the card. Setting this key at all (even to undefined) suppressed the
      // app-root fallback and left /k/<slug> with no card.
    },
  };
}

/** "12+ anggota · 5 kelas", or null when the stats read failed. */
async function memberLabel(slug: string): Promise<string | null> {
  const stats = await getStats(slug);
  if (stats === null) return null;
  const capped = stats.memberCountCapped ? "+" : "";
  return `${stats.memberCount}${capped} anggota · ${stats.courseCount} kelas`;
}

/** Everything both renderings of the nav need. One await, all memoised. */
async function navProps(slug: string) {
  const [tenant, label, signal] = await Promise.all([
    getTenant(slug),
    memberLabel(slug),
    getTabSignal(slug),
  ]);
  if (tenant === null) return null;
  return { slug, name: tenant.name, tenantId: tenant._id, memberLabel: label, signal };
}

async function RailSlot({ slug }: Params) {
  const props = await navProps(slug);
  // Unknown slug: stay silent and let the heading slot render the 404.
  if (props === null) return null;
  return <ShellNav community={props} className="pt-3" />;
}

async function TopBarSlot({ slug }: Params) {
  const props = await navProps(slug);
  if (props === null) return null;
  return <ShellTopBar community={props} />;
}

async function DockSlot({ slug }: Params) {
  const props = await navProps(slug);
  if (props === null) return null;
  return <ShellDock community={props} />;
}

/**
 * THE PAGE HEADING, server-rendered on every route under /k.
 *
 * `sr-only`, and that is a decision rather than an oversight. The community
 * name is already on screen at every width — in the rail at md and up, in the
 * compact bar below it — and printing it a third time at the top of the content
 * pane is the stacked header this rebuild removed. What a heading must actually
 * do it still does: it is real HTML in the server response (crawlers, the
 * document outline), it is the first thing a screen reader hears inside the
 * content, and there is exactly ONE of it at every breakpoint rather than two
 * hidden copies. The visible chrome copies are `aria-hidden` for that reason.
 *
 * notFound() lives here (not in the layout body) so an unknown slug renders the
 * real 404 page instead of an empty shell with a nav in it.
 */
async function HeadingSlot({ slug }: Params) {
  const tenant = await getTenant(slug);
  if (tenant === null) notFound();
  return <h1 className="sr-only">{tenant.name}</h1>;
}

export default async function CommunityLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<Params>;
}) {
  const { slug } = await params;

  return (
    <AppShell
      // Each slot has its OWN boundary: the tenant read is a Convex round trip,
      // and awaiting it in the layout body would hold the whole frame — the
      // content column included — instead of just the chrome. They resolve off
      // the same memoised promise, so in practice they arrive together.
      rail={
        <Suspense fallback={<ShellRailSkeleton />}>
          <RailSlot slug={slug} />
        </Suspense>
      }
      topBar={
        <Suspense fallback={<ShellTopBarSkeleton />}>
          <TopBarSlot slug={slug} />
        </Suspense>
      }
      dock={
        // No fallback: the dock owns its own in-flow spacer, so a placeholder
        // would reserve the space twice. A late dock slides up under content
        // that has not moved.
        <Suspense fallback={null}>
          <DockSlot slug={slug} />
        </Suspense>
      }
      heading={
        <Suspense fallback={null}>
          <HeadingSlot slug={slug} />
        </Suspense>
      }
    >
      {children}
    </AppShell>
  );
}
