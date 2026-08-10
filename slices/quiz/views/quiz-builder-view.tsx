"use client";
// quiz slice — standalone builder page (QuizBuilderView). instructor+ (the
// server mutations/queries are the gate; route guard is UX).
//
// MIGRATION (DECISIONS #37): quizzes hang off a COURSE, and a course may hold
// several, so this view is addressed by `quizId` (edit) or by `courseId`
// alone (create). Discovering which quizzes a course has is the consumer's
// job — useQuizzesForCourse — because the console wants that list as its own
// navigation surface, not buried inside the form.
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/features/responsive-dialog";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SectionHeader } from "@/components/mockup-kit";
import type { Id } from "@convex/_generated/dataModel";
import { QuizBuilderForm, type QuizBuilderFormValues } from "../components/quiz-builder-form";
import { mergeQuizCopy, type QuizCopyOverride } from "../config/copy";
import { useQuizBuilderMutations } from "../hooks/use-quiz-mutations";
import { useQuizForManage } from "../hooks/use-quiz";

export type QuizBuilderViewProps = {
  /** The course the quiz belongs to — required even in edit mode, because a
   *  create submits against it. */
  courseId: Id<"courses">;
  /** Omitted = create a NEW quiz in this course. */
  quizId?: Id<"quizzes">;
  copy?: QuizCopyOverride;
  className?: string;
  /** Called after a successful create (with the new id) or delete (with null). */
  onSaved?: (quizId: Id<"quizzes"> | null) => void;
};

export function QuizBuilderView({
  courseId,
  quizId,
  copy: copyOverride,
  className,
  onSaved,
}: QuizBuilderViewProps) {
  const copy = mergeQuizCopy(copyOverride);
  const existing = useQuizForManage(quizId);
  const { createQuiz, updateQuiz, deleteQuiz } = useQuizBuilderMutations(copyOverride);
  const isLoading = quizId !== undefined && existing === undefined;
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleSave = async (values: QuizBuilderFormValues) => {
    setSubmitting(true);
    try {
      if (existing !== undefined) {
        await updateQuiz(existing._id, values);
      } else {
        const created = await createQuiz(courseId, values);
        if (created !== null) onSaved?.(created);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (existing === undefined) return;
    const ok = await deleteQuiz(existing._id);
    if (ok) onSaved?.(null);
  };

  return (
    <div className={className ? `space-y-6 ${className}` : "space-y-6"}>
      <SectionHeader
        eyebrow={copy.quizTitle}
        title={existing === undefined ? copy.newQuiz : copy.builderTitle}
        actions={
          existing !== undefined ? (
            <Button
              variant="outline"
              size="sm"
              className="min-h-9 shrink-0"
              onClick={() => setConfirmOpen(true)}
            >
              {copy.deleteQuiz}
            </Button>
          ) : undefined
        }
      />
      {existing !== undefined && (
        <ResponsiveDialog open={confirmOpen} onOpenChange={setConfirmOpen} variant="alert" size="sm">
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>{copy.deleteConfirmTitle}</ResponsiveDialogTitle>
          </ResponsiveDialogHeader>
          <ResponsiveDialogBody>
            <p className="text-sm text-muted-foreground">{copy.deleteConfirmBody}</p>
          </ResponsiveDialogBody>
          <ResponsiveDialogFooter>
            <Button type="button" variant="outline" onClick={() => setConfirmOpen(false)}>
              {copy.cancel}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={async () => {
                await handleDelete();
                setConfirmOpen(false);
              }}
            >
              {copy.deleteConfirm}
            </Button>
          </ResponsiveDialogFooter>
        </ResponsiveDialog>
      )}

      {isLoading ? (
        <div className="mx-auto w-full max-w-3xl space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : (
        <QuizBuilderForm
          initial={existing}
          onSave={handleSave}
          submitting={submitting}
          copy={copy}
        />
      )}
    </div>
  );
}
