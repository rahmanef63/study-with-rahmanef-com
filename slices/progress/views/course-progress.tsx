"use client";
// progress slice — connected progress bar for the course overview. The
// integrator drops this into the courses barrel seam CourseOverview.progressSlot
// and feeds the syllabus check marks from the same hook:
//   const p = useCourseProgress(courseId);
//   <CourseOverview … completedLessonIds={p?.completedLessonIds}
//                       progressSlot={<CourseProgress courseId={courseId} />} />
import type { Id } from "@convex/_generated/dataModel";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { CourseProgressBar } from "../components/course-progress-bar";
import type { ProgressCopyOverride } from "../config/copy";
import { useCourseProgress } from "../hooks/use-course-progress";

export type CourseProgressProps = {
  courseId: Id<"courses">;
  copy?: ProgressCopyOverride;
  className?: string;
};

export function CourseProgress({ courseId, copy, className }: CourseProgressProps) {
  const progress = useCourseProgress(courseId);

  if (progress === undefined) {
    return <Skeleton className={cn("h-10 w-full", className)} />;
  }

  return (
    <CourseProgressBar
      completedCount={progress.completedCount}
      totalCount={progress.totalCount}
      isComplete={progress.isComplete}
      copy={copy}
      className={className}
    />
  );
}
