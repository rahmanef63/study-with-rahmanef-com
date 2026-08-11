import type { Metadata } from "next";
import { cache, Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { api } from "@convex/_generated/api";
import { MateriViewRecorder } from "@/features/analytics";
import {
  MateriDetailView,
  MateriPageHeader,
  type PublicMateri,
} from "@/features/materi";
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
//
// Twin: ../../skills/[lessonSlug]/page.tsx. Same file, one segment over, for
// rows with `kind: "skill"` — and each redirects to the other when handed the
// wrong kind's slug (see the note on that check below).
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
  // The canonical is the route for the row's REAL kind, so a wrong-kind URL a
  // crawler reached before following the redirect still consolidates onto one
  // address.
  const canonical =
    materi.kind === "skill" ? communityHref.skillPage(slug, lessonSlug) : path;
  const description =
    materi.courses.length > 0
      ? `Materi ${materi.tenant.name} — dipakai di ${materi.courses.map((c) => c.title).join(", ")}.`
      : `Materi dari komunitas ${materi.tenant.name}.`;
  return {
    title: materi.title,
    description,
    keywords: materi.tags,
    alternates: { canonical },
    openGraph: {
      type: "article",
      title: materi.title,
      description,
      url: absoluteUrl(canonical),
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
      {/* Counts this read for the instructor's funnel. Renders nothing, gates
          itself on membership, and is fire-and-forget — see the component.
          Mounted from the SERVER page because `materi._id` is already in hand
          here: no extra lookup, and no id at all for a draft (publicGetBySlug
          answers null), which is the right outcome — an author previewing
          unpublished work should not appear in their own numbers. */}
      {materi === null || tenant === null ? null : (
        <MateriViewRecorder tenantId={tenant._id} lessonId={materi._id} />
      )}

      {materi === null ? null : (
        <MateriPageHeader
          materi={materi}
          kind="materi"
          shareUrl={absoluteUrl(path)}
          tagHref={(tag) => `${communityHref.materi(slug)}?tag=${encodeURIComponent(tag)}`}
        />
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

  // ONE SLUG NAMESPACE, TWO ROUTES — the mirror of the check in the skills
  // twin, and see that file for why it sits out here rather than inside the
  // Suspense boundary (a streamed redirect is a client-side hop; this one is a
  // real 307, and generateMetadata already paid for the read). A skill's slug
  // arriving here is someone who copied /materi/ out of habit.
  const materi = await getMateri(slug, lessonSlug);
  if (materi !== null && materi.kind === "skill") {
    redirect(communityHref.skillPage(slug, lessonSlug));
  }

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
