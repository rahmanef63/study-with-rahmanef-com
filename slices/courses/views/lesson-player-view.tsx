"use client";
// courses slice — the materi player (member guard lives in the QUERY — this
// only presents). `completionSlot` is progress's (#3) injection seam through
// the barrel.
//
// `courseId` is READING CONTEXT (DECISIONS #37): a materi can be taught by
// several courses, and it decides whose prev/next path the rail walks. Omit
// it on the canonical /materi route.
import type { Id } from "@convex/_generated/dataModel";
import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { LessonView } from "../components/lesson-view";
import type { CoursesCopyOverride } from "../config/copy";
import { useLesson } from "../hooks/use-courses";

export type LessonPlayerViewProps = {
  lessonId: Id<"lessons">;
  /** Which course's prev/next path to walk. Omitted = the first placement. */
  courseId?: Id<"courses"> | null;
  lessonHref: (lessonId: string) => string;
  backHref: string;
  /** From progress (#3): mark-complete button, completion chip, etc. */
  completionSlot?: ReactNode;
  copy?: CoursesCopyOverride;
  className?: string;
};

export function LessonPlayerView({
  lessonId,
  courseId,
  lessonHref,
  backHref,
  completionSlot,
  copy,
  className,
}: LessonPlayerViewProps) {
  const lesson = useLesson(lessonId, courseId);

  if (lesson === undefined) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="aspect-video w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <LessonView
      lesson={lesson}
      lessonHref={lessonHref}
      backHref={backHref}
      completionSlot={completionSlot}
      copy={copy}
      className={className}
    />
  );
}
