"use client";
// quiz slice — standalone builder page (QuizBuilderView). instructor+ (the
// server mutations/queries are the gate; route guard is UX). Loads the
// module's existing quiz for edit, else starts a blank create form. The
// integrator mounts this behind /t/[slug]/kelola/… — it does NOT edit the
// course editor itself (integration points listed in README).
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
import type { Id } from "@convex/_generated/dataModel";
import { QuizBuilderForm, type QuizBuilderFormValues } from "../components/quiz-builder-form";
import { mergeQuizCopy, type QuizCopyOverride } from "../config/copy";
import { useQuizBuilderMutations } from "../hooks/use-quiz-mutations";
import { useQuizForManage } from "../hooks/use-quiz";

export type QuizBuilderViewProps = {
  moduleId: Id<"modules">;
  /** Passed by the route for context; the create mutation derives course +
   * tenant from the module server-side, so these are not sent to Convex. */
  courseId: Id<"courses">;
  tenantId: Id<"tenants">;
  copy?: QuizCopyOverride;
  className?: string;
  /** Optional callback after a successful delete (e.g. route back). */
  onDeleted?: () => void;
};

export function QuizBuilderView({ moduleId, courseId, tenantId, copy: copyOverride, className, onDeleted }: QuizBuilderViewProps) {
  const copy = mergeQuizCopy(copyOverride);
  const existing = useQuizForManage(moduleId);
  const { createQuiz, updateQuiz, deleteQuiz } = useQuizBuilderMutations(copyOverride);
  const isLoading = existing === undefined;
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleSave = async (values: QuizBuilderFormValues) => {
    setSubmitting(true);
    try {
      if (existing) await updateQuiz(existing._id, values);
      else await createQuiz(moduleId, values);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!existing) return;
    const ok = await deleteQuiz(existing._id);
    if (ok) onDeleted?.();
  };

  return (
    <div
      className={className ? `space-y-6 ${className}` : "space-y-6"}
      data-course-id={courseId}
      data-tenant-id={tenantId}
    >
      <div className="flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <span className="eyebrow">{copy.quizTitle}</span>
          <h1 className="mt-1.5 text-2xl sm:text-3xl">{copy.builderTitle}</h1>
        </div>
        {existing && (
          <>
            <Button
              variant="outline"
              className="min-h-11 w-full shrink-0 sm:w-auto"
              onClick={() => setConfirmOpen(true)}
            >
              {copy.deleteQuiz}
            </Button>
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
          </>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : (
        <QuizBuilderForm
          initial={existing ?? undefined}
          onSave={handleSave}
          submitting={submitting}
          copy={copy}
        />
      )}
    </div>
  );
}
