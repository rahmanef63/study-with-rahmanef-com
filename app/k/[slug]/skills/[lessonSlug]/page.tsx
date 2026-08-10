import type { Metadata } from "next";
import { cache, Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { api } from "@convex/_generated/api";
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

// THE skill page — canonical, shareable, indexable. Twin of
// ../../materi/[lessonSlug]/page.tsx, because a skill IS a materi
// (`lessons.kind`); read that file's header for the SSR contract.
//
// WHAT IS DIFFERENT HERE, and it is the whole security question of this
// feature: the PROMPT is member-only. `publicGetBySlug` returns `kind` and
// never `promptText` — the field is not on the anonymous projection at all, so
// there is nothing on this server component to leak. The prompt arrives only
// through the member island's `getBySlug`. An anonymous visitor gets the
// title, the tags, the date and the join CTA; that is the etalase, and it is
// deliberately enough to make the link worth sharing and not enough to make
// joining pointless.
//
// IT MUST NOT notFound() ON null — publicGetBySlug answers null for a DRAFT
// too, and a draft is a real page for its author and for instructor+.
type Params = { slug: string; lessonSlug: string };

// cache(): generateMetadata, the body and the redirect check want the same
// row, and fetchQuery has no per-request dedupe of its own. The return type is
// written out rather than inferred — see the note on the same read in the
// materi twin.
const getSkill = cache(
  async (tenantSlug: string, lessonSlug: string): Promise<PublicMateri | null> =>
    safeQuery(api.features.materi.queries.publicGetBySlug, { tenantSlug, lessonSlug })
);

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug, lessonSlug } = await params;
  const skill = await getSkill(slug, lessonSlug);
  const path = communityHref.skillPage(slug, lessonSlug);
  if (skill === null) {
    // Unknown, draft, or unreachable — never guess a title from the slug.
    return { title: "Skill", alternates: { canonical: path }, robots: { index: false } };
  }
  // The canonical is the route for the row's REAL kind, so a wrong-kind URL
  // that a crawler reached before following the redirect still consolidates
  // onto one address.
  const canonical =
    skill.kind === "skill" ? path : communityHref.materiPage(slug, lessonSlug);
  const description = `Prompt siap pakai dari komunitas ${skill.tenant.name}. Salin, tempel ke AI-nya, langsung jalan.`;
  return {
    title: skill.title,
    description,
    keywords: skill.tags,
    alternates: { canonical },
    openGraph: {
      type: "article",
      title: skill.title,
      description,
      url: absoluteUrl(canonical),
    },
    twitter: { card: "summary_large_image", title: skill.title, description },
  };
}

async function SkillSurface({ slug, lessonSlug }: Params) {
  const [skill, tenant] = await Promise.all([
    getSkill(slug, lessonSlug),
    safeQuery(api.features.tenants.queries.getPublicBySlug, { slug }),
  ]);

  const path = communityHref.skillPage(slug, lessonSlug);

  return (
    <div className="space-y-8">
      {skill === null ? null : (
        <MateriPageHeader
          materi={skill}
          kind="skill"
          shareUrl={absoluteUrl(path)}
          tagHref={(tag) => `${communityHref.skills(slug)}?tag=${encodeURIComponent(tag)}`}
        />
      )}

      {tenant === null ? null : (
        <MateriDetailView
          tenantId={tenant._id}
          tenantSlug={slug}
          lessonSlug={lessonSlug}
          kind="skill"
          hasServerHeading={skill !== null}
          gate={
            <GabungDulu
              tenantId={tenant._id}
              nextHref={path}
              description="Gabung komunitasnya dulu — gratis — lalu prompt-nya langsung kebuka 🌱"
            />
          }
        />
      )}
    </div>
  );
}

export default async function SkillDetailPage({ params }: { params: Promise<Params> }) {
  const { slug, lessonSlug } = await params;

  // ONE SLUG NAMESPACE, TWO ROUTES. Both are rows of `lessons`, so this URL can
  // legitimately be handed a materi's slug by anyone who copied the wrong path
  // out of a chat. Send them to the canonical route for the row's real kind
  // instead of 404ing: a shared link must never dead-end on a detail the
  // reader could not possibly have known.
  //
  // HERE, not inside the Suspense boundary below. `redirect()` from a streaming
  // segment can only be delivered as a client-side hop — the reader watches the
  // wrong page paint and then jump, and a crawler that does not run the script
  // never follows it. Awaiting the read here makes it a real 307, and it is
  // FREE: generateMetadata already awaits the same `cache()`d query before this
  // response can be sent, so nothing new is blocked on Convex.
  //
  // Only fires for a row the anonymous read can see. A DRAFT answers null, so
  // no redirect happens — and none is needed: the island reads the row for real
  // and renders it correctly either way. Nothing dead-ends.
  const skill = await getSkill(slug, lessonSlug);
  if (skill !== null && skill.kind !== "skill") {
    redirect(communityHref.materiPage(slug, lessonSlug));
  }

  return (
    <div className="@container mx-auto w-full max-w-3xl space-y-6">
      <Link
        href={communityHref.skills(slug)}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="size-3.5" aria-hidden />
        Kembali ke Skills
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
        <SkillSurface slug={slug} lessonSlug={lessonSlug} />
      </Suspense>
    </div>
  );
}
