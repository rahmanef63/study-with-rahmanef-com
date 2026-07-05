"use client";
// courses slice — /t/[slug]/kelas/[kelasSlug] client view. Membership is
// derived from the query's viewerRole (non-null = joined) — no cross-slice
// dependency on tenants; the join CTA itself is a consumer slot.
import type { Id } from "@convex/_generated/dataModel";
import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { CourseOverview } from "../components/course-overview";
import type { CoursesCopyOverride } from "../config/copy";

import { useCourseOverview } from "../hooks/use-courses";

export type CourseOverviewViewProps = {
  tenantId: Id<"tenants">;
  courseSlug: string;
  lessonHref: (lessonId: Id<"lessons">) => string;
  /** Rendered for non-members under the header (tenants slice owns join). */
  joinCtaSlot?: ReactNode;
  /** From progress (#3) via barrel. */
  completedLessonIds?: ReadonlyArray<string>;
  progressSlot?: ReactNode;
  copy?: CoursesCopyOverride;
  className?: string;
};

export function CourseOverviewView({
  tenantId,
  courseSlug,
  lessonHref,
  joinCtaSlot,
  completedLessonIds,
  progressSlot,
  copy,
  className,
}: CourseOverviewViewProps) {
  const overview = useCourseOverview(tenantId, courseSlug);

  if (overview === undefined) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <CourseOverview
      overview={overview}
      lessonHref={lessonHref}
      isMember={overview.viewerRole !== null}
      joinCtaSlot={joinCtaSlot}
      completedLessonIds={completedLessonIds}
      progressSlot={progressSlot}
      copy={copy}
      className={className}
    />
  );
}
