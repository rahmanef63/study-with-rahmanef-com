"use client";
// quiz slice — standalone builder page (QuizBuilderView). instructor+ (the
// server mutations/queries are the gate; route guard is UX). Loads the
// module's existing quiz for edit, else starts a blank create form. The
// integrator mounts this behind /t/[slug]/kelola/… — it does NOT edit the
// course editor itself (integration points listed in README).
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">{copy.builderTitle}</h1>
        {existing && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline">{copy.deleteQuiz}</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{copy.deleteConfirmTitle}</AlertDialogTitle>
                <AlertDialogDescription>{copy.deleteConfirmBody}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{copy.cancel}</AlertDialogCancel>
                <AlertDialogAction onClick={() => void handleDelete()}>
                  {copy.deleteConfirm}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
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
