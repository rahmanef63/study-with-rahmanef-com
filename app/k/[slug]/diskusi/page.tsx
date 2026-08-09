import type { Metadata } from "next";
import { Suspense } from "react";
import { api } from "@convex/_generated/api";
import { FeedView, FEED_PAGE_SIZE } from "@/features/posts";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { communityHref } from "@/lib/community";
import { safeQuery } from "@/lib/convex-server";

// Diskusi — the community feed (#29). This page is the reason the feed exists
// as real HTML: publicListFeed and publicGetPost are on the anonymous etalase
// whitelist (AGENTS.md §6), so the first page is server-rendered for crawlers
// and for anyone who lands here logged out. The composer, likes and replies
// hydrate as a member-gated client island inside <FeedView/>.
type Params = { slug: string };

const FEED_TITLE = "Diskusi";
const FEED_DESCRIPTION =
  "Pertanyaan, pengumuman, usulan, dan sumber belajar dari anggota komunitas.";

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: FEED_TITLE,
    description: FEED_DESCRIPTION,
    alternates: { canonical: communityHref.diskusi(slug) },
    // Indexable now (it was not while the tab was three member-only boards):
    // the feed body is anonymous etalase and every card links a real permalink.
    openGraph: { type: "website", title: FEED_TITLE, description: FEED_DESCRIPTION },
  };
}

async function DiskusiBody({ slug }: { slug: string }) {
  const tenant = await safeQuery(api.features.tenants.queries.getPublicBySlug, { slug });
  // An unknown slug already 404s in the layout, so null here means Convex is
  // unreachable — say so instead of rendering an empty page.
  if (tenant === null) {
    return (
      <Empty className="border-2">
        <EmptyHeader>
          <EmptyTitle className="font-display text-xs uppercase">
            Diskusi belum bisa dimuat
          </EmptyTitle>
          <EmptyDescription className="text-pretty">
            Koneksi ke server sedang bermasalah. Coba muat ulang halaman ini sebentar lagi.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  // First page, anonymously. safeQuery never throws: a Convex hiccup degrades
  // to the client view retrying over the socket, not to a 500 on the most
  // shareable page in the community.
  const firstPage = await safeQuery(api.features.posts.queries.publicListFeed, {
    tenantId: tenant._id,
    paginationOpts: { numItems: FEED_PAGE_SIZE, cursor: null },
  });

  return (
    <FeedView
      tenantId={tenant._id}
      initialPosts={firstPage?.page ?? []}
      postHref={(postId) => communityHref.post(slug, postId)}
      profileHref={(username) => communityHref.profile(username)}
      loginHref={`/masuk?next=${encodeURIComponent(communityHref.diskusi(slug))}`}
    />
  );
}

export default async function DiskusiPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <span className="eyebrow">Papan diskusi</span>
        <h1 className="text-base @sm:text-lg">{FEED_TITLE}</h1>
        <p className="max-w-2xl text-pretty text-sm text-muted-foreground">
          {FEED_DESCRIPTION}
        </p>
      </header>
      {/* Own boundary: the awaited etalase reads are dynamic (cacheComponents). */}
      <Suspense
        fallback={
          <div className="space-y-3" aria-busy>
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        }
      >
        <DiskusiBody slug={slug} />
      </Suspense>
    </div>
  );
}
