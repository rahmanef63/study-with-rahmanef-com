import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { BreadcrumbTrail } from "@/components/shell/breadcrumb-trail";
import { communityBreadcrumbs } from "@/components/shell/breadcrumb-model";
import { Skeleton } from "@/components/ui/skeleton";
import { communityHref } from "@/lib/community";
import { KuisSurface } from "../../../_components/kuis-surface";
import { safeQuery } from "@/lib/convex-server";

// Course quiz. QuizTakeView owns the whole thing (answer-stripped read,
// server-side grading, its own empty/result states); this route only frames it
// with a way back to the course. Member-gated + graded server-side, so it is
// never indexed.
//
// MATERI MODEL (DECISIONS #37): the segment is a quizId. A quiz belongs to the
// course, not to a module, and a course may hold several.
export const metadata: Metadata = { title: "Kuis", robots: { index: false } };

type Params = { slug: string; courseSlug: string; quizId: string };

/** Course title for the trail. Both etalase reads may be null (draft, Convex
 *  down); the quiz below still works, and the trail falls back to the slug. */
async function KuisBreadcrumb({ slug, courseSlug, quizId }: Params) {
  const tenant = await safeQuery(api.features.tenants.queries.getPublicBySlug, { slug });
  const overview =
    tenant === null
      ? null
      : await safeQuery(api.features.courses.queries.getOverview, {
          tenantId: tenant._id,
          courseSlug,
        });
  return (
    <BreadcrumbTrail
      items={communityBreadcrumbs(communityHref.quiz(slug, courseSlug, quizId), slug, overview ? { course: overview.course.title } : undefined)}
    />
  );
}

export default async function KuisPage({ params }: { params: Promise<Params> }) {
  const { slug, courseSlug, quizId } = await params;
  return (
    // @container: QuizTakeView's Hero/StatTile layout sizes to its CONTAINER.
    <div className="@container space-y-6">
      {/* The quiz itself is the hero (QuizTakeView renders one), so the course
          reads as framing here, not a competing display title. */}
      <header className="space-y-2.5">
        <Suspense fallback={<Skeleton className="h-4 w-48" />}>
          <KuisBreadcrumb slug={slug} courseSlug={courseSlug} quizId={quizId} />
        </Suspense>
        <Link
          href={communityHref.course(slug, courseSlug)}
          className="-ml-1 inline-flex min-h-11 items-center gap-1.5 px-1 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="size-4 shrink-0" aria-hidden /> Kembali ke kelas
        </Link>
      </header>
      <KuisSurface
        slug={slug}
        courseSlug={courseSlug}
        // A malformed id is rejected by the Convex validator, which surfaces as
        // the route error boundary — same as every other id-in-URL route here.
        quizId={quizId as Id<"quizzes">}
      />
    </div>
  );
}
