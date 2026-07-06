"use client";
// progress slice — connected mark-complete control for the lesson player. The
// integrator drops this into the courses barrel seam LessonView.completionSlot:
//   <LessonView … completionSlot={<LessonCompletion lessonId={lesson._id} />} />
// It owns the read + mutation; CompletionButton stays presentational.
import type { Id } from "@convex/_generated/dataModel";
import { CompletionButton } from "../components/completion-button";
import type { ProgressCopyOverride } from "../config/copy";
import { useLessonCompletion } from "../hooks/use-lesson-completion";
import { useMarkLessonComplete } from "../hooks/use-progress-mutations";

export type LessonCompletionProps = {
  lessonId: Id<"lessons">;
  copy?: ProgressCopyOverride;
  className?: string;
};

export function LessonCompletion({ lessonId, copy, className }: LessonCompletionProps) {
  const completion = useLessonCompletion(lessonId);
  const { markComplete, isPending } = useMarkLessonComplete(copy);
  const isLoading = completion === undefined;

  return (
    <CompletionButton
      isCompleted={completion?.isCompleted ?? false}
      isPending={isPending || isLoading}
      onComplete={() => {
        void markComplete(lessonId);
      }}
      copy={copy}
      className={className}
    />
  );
}
