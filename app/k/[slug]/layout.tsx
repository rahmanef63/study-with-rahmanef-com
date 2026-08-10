import type { Metadata } from "next";
import { cache, Suspense } from "react";
import { notFound } from "next/navigation";
import { api } from "@convex/_generated/api";
import { CommunityActions } from "@/components/community/community-actions";
import { CommunityBottomNav } from "@/components/community/community-bottom-nav";
import { CommunityBrandRow } from "@/components/community/community-brand-row";
import { CommunityNavAction } from "@/components/community/community-nav-action";
import {
  CommunityNavBar,
  CommunityNavBarSkeleton,
} from "@/components/community/community-nav-bar";
import { CommunityTabs } from "@/components/community/community-tabs";
import { NavCollapseSentinel } from "@/components/community/nav-collapse-sentinel";
import { Skeleton } from "@/components/ui/skeleton";
import { safeQuery } from "@/lib/convex-server";
import { absoluteUrl } from "@/lib/site";
import { communityHref } from "@/lib/community";

// The community shell. Server-rendered, so the community name is real HTML on
// every page under it.
//
// TWO SHAPES, ONE DATA READ. Below md this is an iOS navigation bar: a 54px
// sticky compact bar plus a large title that scrolls under it. At md and up it
// is the desktop header it always was — brand row, title, description, counts,
// actions, tab strip — pixel for pixel.
//
// WHAT THE PHONE HEADER NO LONGER CARRIES (152px of the old 261px):
//   · brand mark + wordmark (48px) — inside a community, the community IS the
//     brand; in an installed PWA the wordmark is the icon you just tapped.
//   · the description (44px) — read once, before joining. It is the opening
//     paragraph of Tentang, one tap away in the phone bar's "Lainnya" sheet.
//   · "Cari" + "Komunitas lain" — already in that same sheet, and Cari is also
//     the bar's trailing action for a member (community-nav-action.tsx).
//   · "Bagikan" (60px row, with Login) — occasional, and already on Tentang
//     beside the description it is sharing.
// WHAT SURVIVES: the name (you must know where you are), the counts as a 10px
// subtitle (social proof, on the screen where joining is the decision), and
// exactly one action.
//
// getPublicBySlug / getPublicStatsBySlug are on the anonymous etalase
// whitelist (AGENTS.md §6). Anything membership-aware is a client island
// because server components here are always anonymous.
type Params = { slug: string };

// cache(): generateMetadata, the bar and the title block all need the tenant,
// and fetchQuery has no per-request dedupe of its own — without this every page
// under /k costs three identical Convex round trips before it renders.
const getTenant = cache(async (slug: string) =>
  safeQuery(api.features.tenants.queries.getPublicBySlug, { slug })
);
const getStats = cache(async (slug: string) =>
  safeQuery(api.features.tenants.queries.getPublicStatsBySlug, { slug })
);

/** Shared gutter: 16px on a phone, the original 20px from md up. */
const SHELL = "mx-auto w-full max-w-5xl px-4 md:px-5";

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
      // the card. Setting this key at all (even to undefined) is what suppressed
      // the app-root fallback and left /k/<slug> with no card once the seeded
      // stock covers were cleared.
    },
  };
}

// Rendered OUTSIDE <header> on purpose: a sticky element can only stick inside
// its own parent's box, and the header is ~100px tall — parked in there the bar
// scrolled away with it after the first flick. Its parent is the page root, so
// it now sticks for the full length of the document.
async function CommunityNavBarSlot({ slug }: { slug: string }) {
  const tenant = await getTenant(slug);
  // Unknown slug: stay silent and let the title block below render the 404.
  if (tenant === null) return null;
  return (
    <CommunityNavBar
      title={tenant.name}
      action={<CommunityNavAction tenantId={tenant._id} slug={slug} />}
    />
  );
}

async function CommunityTitle({ slug }: { slug: string }) {
  const [tenant, stats] = await Promise.all([getTenant(slug), getStats(slug)]);
  // notFound() here (not in the layout body) so an unknown slug renders the
  // real 404 page instead of an empty shell with tabs.
  if (tenant === null) notFound();

  const memberLabel =
    stats === null
      ? null
      : `${stats.memberCount}${stats.memberCountCapped ? "+" : ""} anggota · ${stats.courseCount} kelas`;

  return (
    <>
      {/* @container: every reused slice view and mockup-kit primitive sizes
          itself with container queries (a leftover of the windowed shell). A
          real route has to declare one or those variants never match. */}
      <div className={`@container ${SHELL} pb-2 md:pb-0`}>
        <div className="pt-1 md:flex md:flex-wrap md:items-start md:justify-between md:gap-4 md:pt-6">
          <div className="min-w-0 md:space-y-1">
            {/* ONE h1 at every width — the large title and the desktop heading
                are the same element, not two hidden copies. The max-md: caps
                hold it to two lines so a long name cannot blow the budget. */}
            <h1 className="text-balance font-display text-base @sm:text-lg max-md:line-clamp-2 max-md:text-sm max-md:leading-[1.1]">
              {tenant.name}
            </h1>
            <p className="hidden max-w-2xl text-pretty text-sm text-muted-foreground md:block">
              {tenant.description}
            </p>
            {memberLabel ? (
              // Desktop metrics untouched (`text-xs`, inherited 1.7 leading);
              // the phone shrinks it to a 10px subtitle riding under the title.
              <p className="text-xs text-muted-foreground max-md:text-[0.625rem] max-md:leading-tight">
                {memberLabel}
              </p>
            ) : null}
          </div>
          {/* Phone gets <CommunityNavAction/> in the bar instead. */}
          <div className="hidden md:block">
            <CommunityActions tenantId={tenant._id} slug={slug} name={tenant.name} />
          </div>
        </div>
      </div>
      <NavCollapseSentinel />
    </>
  );
}

function CommunityTitleSkeleton() {
  return (
    <div className={`${SHELL} pb-2 md:pb-0`}>
      <div className="space-y-2 pt-1 md:pt-6">
        <Skeleton className="h-4 w-56 md:h-8 md:w-64" />
        <Skeleton className="hidden h-4 w-full max-w-xl md:block" />
        <Skeleton className="h-3 w-32" />
      </div>
    </div>
  );
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
    <div className="min-h-dvh bg-background">
      <Suspense fallback={<CommunityNavBarSkeleton />}>
        <CommunityNavBarSlot slug={slug} />
      </Suspense>
      {/* Solid card below md so the large title disappears INTO the bar rather
          than under a translucent one; the original wash from md up. */}
      <header className="border-b bg-card md:bg-card/40">
        {/* Desktop chrome, outside every Suspense boundary on purpose: it needs
            no data, so navigation never waits on Convex for it. */}
        <CommunityBrandRow slug={slug} className={`hidden ${SHELL} md:block`} />
        <Suspense fallback={<CommunityTitleSkeleton />}>
          <CommunityTitle slug={slug} />
        </Suspense>
        <div className={`hidden ${SHELL} pt-4 md:block`}>
          <CommunityTabs slug={slug} />
        </div>
      </header>
      <main className={`@container ${SHELL} py-5 md:py-8`}>{children}</main>
      {/* Phone-only. Renders its own in-flow spacer, so <main> needs no extra
          bottom padding and pages where the bar hides get none. */}
      <CommunityBottomNav slug={slug} />
    </div>
  );
}
