"use client";

// The materi sheet read INSIDE a course: content sheet + course-nav rail (a
// column on wide screens, a disclosure on narrow ones). The rail's hrefs are
// real routes, so the router handles them.
//
// MATERI MODEL (DECISIONS #37): the materi is tenant-level content; the course
// only supplies reading context (order, prev/next, the rail).
//
// Fully client-side on purpose: getLesson requires membership, so there is
// nothing a permanently-anonymous server component could render here.
import { List } from "lucide-react";
import type { Id } from "@convex/_generated/dataModel";
import { LessonPlayerView, useCourseOverview } from "@/features/courses";
import { LessonComments } from "@/features/comments";
import { LessonCompletion } from "@/features/progress";
import { CourseNav } from "@/features/roadmap";
import { useTenantBySlug } from "@/features/tenants";
import { Skeleton } from "@/components/ui/skeleton";
import { GabungDulu } from "../../_components/gabung-dulu";
import { communityHref } from "@/lib/community";

type Props = { slug: string; courseSlug: string; lessonId: Id<"lessons"> };

function LessonSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="aspect-video w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}

function LessonBody({ tenantId, slug, courseSlug, lessonId }: Props & { tenantId: Id<"tenants"> }) {
  const overview = useCourseOverview(tenantId, courseSlug);
  const courseHref = communityHref.course(slug, courseSlug);

  if (overview === undefined) return <LessonSkeleton />;
  // Outsiders land here from a shared link; getLesson would throw NOT_AUTHORIZED
  // straight into app/error.tsx, so gate on viewerRole first — as the OS app did.
  if (overview.viewerRole == null) {
    return (
      <GabungDulu
        tenantId={tenantId}
        nextHref={communityHref.lesson(slug, courseSlug, lessonId)}
        description="Gabung komunitasnya dulu — gratis — lalu materinya langsung kebuka 🌱"
      />
    );
  }

  const nav = (
    <CourseNav
      tenantId={tenantId}
      courseSlug={courseSlug}
      lessonHref={(id) => communityHref.lesson(slug, courseSlug, id)}
      overviewHref={courseHref}
      currentLessonId={lessonId}
    />
  );

  return (
    <div className="@3xl:grid @3xl:grid-cols-[minmax(15rem,17rem)_1fr] @3xl:gap-8">
      {/* Secondary sidebar: a rail on wide screens. Flows in the page scroll
          rather than pinning itself — a `sticky` rail with its own scroll needs
          a height container the tabbed host does not give it. */}
      <aside className="hidden @3xl:block">
        <div className="pr-1">{nav}</div>
      </aside>
      <details className="mb-4 border border-border bg-card @3xl:hidden">
        <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-2.5 text-sm font-medium [&::-webkit-details-marker]:hidden">
          <List className="size-4 text-muted-foreground" aria-hidden />
          Daftar materi
        </summary>
        <div className="border-t border-border px-4 py-3">{nav}</div>
      </details>
      <div className="min-w-0">
        <LessonPlayerView
          lessonId={lessonId}
          // Reading context: prev/next must follow THIS course's order, not
          // whichever course happens to place the materi first.
          courseId={overview.course._id}
          lessonHref={(id) => communityHref.lesson(slug, courseSlug, id)}
          backHref={courseHref}
          completionSlot={<LessonCompletion lessonId={lessonId} />}
        />
        <div className="mt-8">
          <LessonComments lessonId={lessonId} />
        </div>
      </div>
    </div>
  );
}

export function LessonSurface({ slug, courseSlug, lessonId }: Props) {
  const tenant = useTenantBySlug(slug);
  if (tenant === undefined) return <LessonSkeleton />;
  if (tenant === null) return null; // unknown community — the layout already 404s
  return (
    <LessonBody tenantId={tenant._id} slug={slug} courseSlug={courseSlug} lessonId={lessonId} />
  );
}
