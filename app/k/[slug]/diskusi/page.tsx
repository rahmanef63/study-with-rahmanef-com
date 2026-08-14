import type { Metadata } from "next";
import { Suspense } from "react";
import { api } from "@convex/_generated/api";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { communityHref } from "@/lib/community";
import { safeQuery } from "@/lib/convex-server";
import { PageHeading } from "../_components/page-heading";
import { PapanDiskusi } from "./_components/papan-diskusi";
import { FEED_PAGE_SIZE, parsePostKind } from "@/features/posts";

// Diskusi — the community feed (#29). This page is the reason the feed exists
// as real HTML: publicListFeed and publicGetPost are on the anonymous etalase
// whitelist (AGENTS.md §6), so the first page is server-rendered for crawlers
// and for anyone who lands here logged out. The composer, likes and replies
// hydrate as a member-gated client island inside <FeedView/>.
type Params = { slug: string };
// `?kind=sumber` etc. — the Silabus "Sumber belajar" card and the retired
// /resources + /pengumuman redirects land here. Anything unrecognised parses
// back to null ("Semua"), so a junk param can never render an empty board.
type Search = { kind?: string | string[] };

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
    // NO `openGraph` key. Declaring one here without `images` SUPPRESSES the
    // inherited card entirely — the same trap the /k/[slug] layout documents —
    // and this page was shipping with no og:image at all. Omitting it lets the
    // parent's openGraph and its colocated opengraph-image.tsx apply, and Next
    // still fills og:title from the title template above.
  };
}

async function DiskusiBody({
  slug,
  searchParams,
}: {
  slug: string;
  searchParams: Promise<Search>;
}) {
  // Awaited HERE, inside the Suspense boundary, not in the page shell: the
  // header above must not wait on request data to paint.
  const { kind } = await searchParams;
  const initialKind = parsePostKind(Array.isArray(kind) ? kind[0] : kind);
  const tenant = await safeQuery(api.features.tenants.queries.getPublicBySlug, { slug });
  // An unknown slug already 404s in the layout, so null here means Convex is
  // unreachable — say so instead of rendering an empty page.
  if (tenant === null) {
    return (
      <Empty className="gap-4 border p-5 md:p-8">
        <EmptyHeader className="gap-1.5">
          <EmptyTitle className="font-display">
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
    <PapanDiskusi
      tenantId={tenant._id}
      slug={slug}
      initialPosts={firstPage?.page ?? []}
      initialKind={initialKind}
    />
  );
}

export default async function DiskusiPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<Search>;
}) {
  const { slug } = await params;
  // ONE LINE, not the old title block. The eyebrow "Papan diskusi" + h1
  // "Diskusi" + a two-line description cost ~150px in front of the kind chips,
  // and the chips are the control this screen exists for: choosing between
  // Semua / Diskusi / Pengumuman / Usulan / Sumber is the first thing anyone
  // does here, and every one of those five chips is a plainer statement of
  // "pertanyaan, pengumuman, usulan, dan sumber belajar" than the sentence was.
  // So the description stays deleted and lives on in the <title> and the OG
  // description in generateMetadata above.
  //
  // The TITLE, however, came back. It was removed because "the tab bar already
  // names the page" — and the tab bar was deleted on 2026-08-11. Below md the
  // rail that replaced it is behind a hamburger and the layout's <h1> is
  // sr-only, so without this the screen opened on a row of unlabelled chips.
  return (
    <>
      <PageHeading title="Diskusi" />
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
        <DiskusiBody slug={slug} searchParams={searchParams} />
      </Suspense>
    </>
  );
}
