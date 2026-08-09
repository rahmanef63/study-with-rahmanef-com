import type { Metadata } from "next";
import { cache, Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Search } from "lucide-react";
import { api } from "@convex/_generated/api";
import { LogoMark } from "@/components/brand/logo";
import { CommunityActions } from "@/components/community/community-actions";
import { CommunityBottomNav } from "@/components/community/community-bottom-nav";
import { CommunityTabs } from "@/components/community/community-tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { safeQuery } from "@/lib/convex-server";
import { absoluteUrl } from "@/lib/site";
import { communityHref } from "@/lib/community";

// The community shell. Server-rendered, so the community name is real HTML on
// every page under it — the whole "OS desktop → Skool" transformation from a
// learner's point of view, in ~120 lines instead of a window manager.
//
// getPublicBySlug / getPublicStatsBySlug are on the anonymous etalase
// whitelist (AGENTS.md §6). Anything membership-aware is a client island
// (<CommunityActions/>) because server components here are always anonymous.
type Params = { slug: string };

// cache(): generateMetadata and the header child both need the tenant, and
// fetchQuery has no per-request dedupe of its own — without this every page
// under /k costs two identical Convex round trips before it renders anything.
const getTenant = cache(async (slug: string) =>
  safeQuery(api.features.tenants.queries.getPublicBySlug, { slug })
);
const getStats = cache(async (slug: string) =>
  safeQuery(api.features.tenants.queries.getPublicStatsBySlug, { slug })
);

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
      images: tenant.coverImageUrl ? [{ url: tenant.coverImageUrl }] : undefined,
    },
  };
}

async function CommunityHeader({ slug }: { slug: string }) {
  const [tenant, stats] = await Promise.all([
    getTenant(slug),
    getStats(slug),
  ]);
  // notFound() here (not in the layout body) so an unknown slug renders the
  // real 404 page instead of an empty shell with tabs.
  if (tenant === null) notFound();

  const memberLabel =
    stats === null
      ? null
      : `${stats.memberCount}${stats.memberCountCapped ? "+" : ""} anggota · ${stats.courseCount} kelas`;

  return (
    <div className="space-y-4 pt-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <h1 className="text-balance font-display text-base @sm:text-lg">{tenant.name}</h1>
          <p className="max-w-2xl text-pretty text-sm text-muted-foreground">
            {tenant.description}
          </p>
          {memberLabel ? (
            <p className="text-xs text-muted-foreground">{memberLabel}</p>
          ) : null}
        </div>
        <CommunityActions tenantId={tenant._id} slug={slug} name={tenant.name} />
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
      <header className="border-b bg-card/40">
        {/* @container: every reused slice view and mockup-kit primitive sizes
            itself with container queries (a leftover of the windowed shell,
            which established the container). A real route has to declare one or
            those variants never match and the views collapse to one column. */}
        {/* pb below md replaces the bottom padding the (now desktop-only) tab
            strip used to contribute. */}
        <div className="@container mx-auto w-full max-w-5xl px-5 pb-4 md:pb-0">
          {/* One line at EVERY width. At 320px this used to wrap onto two lines
              and collide, so below `sm` the wordmark and "Komunitas lain" drop
              out: the mark alone still reads as home, and "Komunitas lain" is a
              rare action that now lives in the phone bar's "Lainnya" sheet. */}
          <div className="flex min-h-12 items-center justify-between gap-3 text-sm">
            <Link
              href="/"
              // min-w-11 + negative margin: below sm the label is gone and the
              // 16px mark alone would be a 16px tap target.
              className="-ml-2 inline-flex min-h-11 min-w-11 items-center gap-2 px-2 font-medium sm:ml-0 sm:min-w-0 sm:px-0"
              aria-label="Beranda belajar with rahmanef"
            >
              <LogoMark className="size-4 shrink-0 text-primary" aria-hidden />
              <span className="hidden font-display text-[0.6rem] uppercase tracking-wider text-muted-foreground sm:inline">
                belajar·with·rahmanef
              </span>
            </Link>
            <div className="flex items-center gap-1 sm:gap-3">
              {/* Search is a tool, not a destination — a header affordance
                  instead of a sixth tab competing for a learner's attention.
                  Icon-only below sm, but still a full 44px target. */}
              <Link
                href={communityHref.cari(slug)}
                aria-label="Cari kelas & materi"
                className="-mr-2 inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 text-muted-foreground hover:text-foreground sm:mr-0 sm:min-w-0"
              >
                <Search className="size-4 shrink-0 sm:size-3.5" aria-hidden />
                <span className="hidden sm:inline">Cari</span>
              </Link>
              <Link
                href="/komunitas"
                className="hidden min-h-11 items-center text-muted-foreground hover:text-foreground sm:inline-flex"
              >
                Komunitas lain
              </Link>
            </div>
          </div>
          {/* Own boundary: the awaited etalase reads are dynamic. The tab strip
              below renders immediately so navigation never waits on data. */}
          <Suspense
            fallback={
              <div className="space-y-3 pt-6">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-full max-w-xl" />
              </div>
            }
          >
            <CommunityHeader slug={slug} />
          </Suspense>
          <div className="hidden pt-4 md:block">
            <CommunityTabs slug={slug} />
          </div>
        </div>
      </header>
      <main className="@container mx-auto w-full max-w-5xl px-5 py-8">{children}</main>
      {/* Phone-only. Renders its own in-flow spacer, so <main> needs no extra
          bottom padding and pages where the bar hides get none. */}
      <CommunityBottomNav slug={slug} />
    </div>
  );
}
