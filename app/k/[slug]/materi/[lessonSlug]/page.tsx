import type { Metadata } from "next";
import { cache, Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, PlayCircle } from "lucide-react";
import { api } from "@convex/_generated/api";
import { MateriDetailView, TagRow, type PublicMateri } from "@/features/materi";
import { TombolBagikan } from "@/components/tombol-bagikan";
import { Skeleton } from "@/components/ui/skeleton";
import { communityHref } from "@/lib/community";
import { safeQuery } from "@/lib/convex-server";
import { absoluteUrl } from "@/lib/site";
import { GabungDulu } from "../../_components/gabung-dulu";

// THE materi page — canonical, shareable, indexable (DECISIONS #36/#37).
//
// publicGetBySlug is on the anonymous etalase whitelist (AGENTS.md §6), so the
// title, the tags and which published courses teach this materi are real HTML
// for a crawler and for a logged-out recipient of the link. The BODY is not:
// it is a member-gated client island below.
//
// IT MUST NOT notFound() ON null. publicGetBySlug answers null for a DRAFT
// materi too, and a draft is a real page for its author and for instructor+ —
// 404ing here would hide unpublished work from the person writing it. Null
// means "no server heading"; the island renders the heading from the member
// read instead.
type Params = { slug: string; lessonSlug: string };

// cache(): generateMetadata and the body want the same two rows, and
// fetchQuery has no per-request dedupe of its own.
//
// The return type is written out rather than inferred: `safeQuery` widens to
// the query's return type, and `FunctionReturnType` on a codegen'd api ref
// degrades to `any` in this repo — so without this annotation every field read
// below would be an unchecked `any`, and the etalase projection is exactly the
// shape a P0 says must never quietly grow a body.
const getMateri = cache(
  async (tenantSlug: string, lessonSlug: string): Promise<PublicMateri | null> =>
    safeQuery(api.features.materi.queries.publicGetBySlug, { tenantSlug, lessonSlug })
);

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug, lessonSlug } = await params;
  const materi = await getMateri(slug, lessonSlug);
  const path = communityHref.materiPage(slug, lessonSlug);
  if (materi === null) {
    // Unknown, draft, or unreachable — never guess a title from the slug.
    return { title: "Materi", alternates: { canonical: path }, robots: { index: false } };
  }
  const description =
    materi.courses.length > 0
      ? `Materi ${materi.tenant.name} — dipakai di ${materi.courses.map((c) => c.title).join(", ")}.`
      : `Materi dari komunitas ${materi.tenant.name}.`;
  return {
    title: materi.title,
    description,
    keywords: materi.tags,
    alternates: { canonical: path },
    openGraph: {
      type: "article",
      title: materi.title,
      description,
      url: absoluteUrl(path),
    },
    twitter: { card: "summary_large_image", title: materi.title, description },
  };
}

async function MateriSurface({ slug, lessonSlug }: Params) {
  const [materi, tenant] = await Promise.all([
    getMateri(slug, lessonSlug),
    safeQuery(api.features.tenants.queries.getPublicBySlug, { slug }),
  ]);
  const path = communityHref.materiPage(slug, lessonSlug);

  return (
    <div className="space-y-8">
      {materi === null ? null : (
        <header className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="eyebrow border px-2 py-0.5 text-[10px]">Materi</span>
            {materi.hasVideo ? (
              <span className="inline-flex items-center gap-1 border border-accent/50 bg-accent/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-accent">
                <PlayCircle className="size-3" aria-hidden />
                Video
              </span>
            ) : null}
            <time
              dateTime={new Date(materi.createdAt).toISOString()}
              className="text-muted-foreground"
            >
              {new Date(materi.createdAt).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </time>
          </div>

          {/* The ONE h1 of this page, in server HTML. The island is told not to
              render a second one (`hasServerHeading`). */}
          <h1 className="text-balance text-base [overflow-wrap:anywhere] @sm:text-lg">
            {materi.title}
          </h1>

          <div className="flex flex-wrap items-center justify-between gap-3 border-y border-border py-3">
            {/* Server-rendered tag links: indexable, and they work with JS off.
                The island renders the live tag row again under the body, where
                a reader who just finished reading wants it. */}
            <TagRow
              tags={materi.tags}
              tagHref={(tag) => `${communityHref.materi(slug)}?tag=${encodeURIComponent(tag)}`}
            />
            <TombolBagikan url={absoluteUrl(path)} title={materi.title} variant="ghost" />
          </div>
        </header>
      )}

      {tenant === null ? null : (
        <MateriDetailView
          tenantId={tenant._id}
          tenantSlug={slug}
          lessonSlug={lessonSlug}
          hasServerHeading={materi !== null}
          gate={
            <GabungDulu
              tenantId={tenant._id}
              nextHref={path}
              description="Gabung komunitasnya dulu — gratis — lalu materinya langsung kebuka 🌱"
            />
          }
        />
      )}
    </div>
  );
}

export default async function MateriDetailPage({ params }: { params: Promise<Params> }) {
  const { slug, lessonSlug } = await params;
  return (
    <div className="@container mx-auto w-full max-w-3xl space-y-6">
      <Link
        href={communityHref.materi(slug)}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="size-3.5" aria-hidden />
        Kembali ke Materi
      </Link>
      <Suspense
        fallback={
          <div className="space-y-4" aria-busy>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        }
      >
        <MateriSurface slug={slug} lessonSlug={lessonSlug} />
      </Suspense>
    </div>
  );
}
