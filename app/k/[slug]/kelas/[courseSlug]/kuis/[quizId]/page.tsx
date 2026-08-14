import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
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

/** Breadcrumb context. Two anonymous etalase reads (slug → tenant → overview);
 *  both may come back null (draft course, Convex down) and the quiz below still
 *  works, so this degrades to nothing rather than blocking the page. */
async function KuisBreadcrumb({ slug, courseSlug }: { slug: string; courseSlug: string }) {
  const tenant = await safeQuery(api.features.tenants.queries.getPublicBySlug, { slug });
  const overview =
    tenant === null
      ? null
      : await safeQuery(api.features.courses.queries.getOverview, {
          tenantId: tenant._id,
          courseSlug,
        });
  return (
    <div className="min-w-0 space-y-1">
      <span className="eyebrow">{tenant === null ? "Kuis" : `${tenant.name} · Kuis`}</span>
      {overview === null ? null : (
        <p className="truncate text-pretty font-display text-muted-foreground">
          {overview.course.title}
        </p>
      )}
    </div>
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
        <Link
          href={communityHref.course(slug, courseSlug)}
          className="-ml-1 inline-flex min-h-11 items-center gap-1.5 px-1 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="size-4 shrink-0" aria-hidden /> Kembali ke kelas
        </Link>
        {/* Own boundary: the etalase reads are dynamic (cacheComponents). */}
        <Suspense fallback={<Skeleton className="h-6 w-56" />}>
          <KuisBreadcrumb slug={slug} courseSlug={courseSlug} />
        </Suspense>
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
