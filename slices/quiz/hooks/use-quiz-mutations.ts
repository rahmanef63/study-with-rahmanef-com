"use client";
// quiz slice — builder + attempt mutation hooks. Errors are caught here,
// mapped code → Bahasa Indonesia copy, surfaced via the shared toast (sonner)
// — never swallowed, never alert() (rr error-handling rules).
import { useMutation } from "convex/react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { mergeQuizCopy, type QuizCopyOverride } from "../config/copy";
import { quizErrorMessage } from "../lib/errors";
import type { AttemptResult, QuizQuestionInput } from "../types";

export type SaveQuizInput = {
  title: string;
  passingScorePct: number;
  questions: QuizQuestionInput[];
};

/** Builder writes (create/update/delete). Each returns id/true on success,
 * null on error (toasted). create vs update is chosen by the caller. */
export function useQuizBuilderMutations(copyOverride?: QuizCopyOverride) {
  const copy = mergeQuizCopy(copyOverride);
  const createRaw = useMutation(api.features.quiz.builder.createQuiz);
  const updateRaw = useMutation(api.features.quiz.builder.updateQuiz);
  const deleteRaw = useMutation(api.features.quiz.builder.deleteQuiz);

  const createQuiz = useCallback(
    async (moduleId: Id<"modules">, input: SaveQuizInput) => {
      try {
        const id = (await createRaw({ moduleId, ...input })) as Id<"quizzes">;
        toast.success(copy.saveSuccess);
        return id;
      } catch (error) {
        toast.error(quizErrorMessage(error, copy));
        return null;
      }
    },
    [createRaw, copy]
  );

  const updateQuiz = useCallback(
    async (quizId: Id<"quizzes">, input: SaveQuizInput) => {
      try {
        const id = (await updateRaw({ quizId, ...input })) as Id<"quizzes">;
        toast.success(copy.saveSuccess);
        return id;
      } catch (error) {
        toast.error(quizErrorMessage(error, copy));
        return null;
      }
    },
    [updateRaw, copy]
  );

  const deleteQuiz = useCallback(
    async (quizId: Id<"quizzes">) => {
      try {
        await deleteRaw({ quizId });
        toast.success(copy.deleted);
        return true;
      } catch (error) {
        toast.error(quizErrorMessage(error, copy));
        return false;
      }
    },
    [deleteRaw, copy]
  );

  return { createQuiz, updateQuiz, deleteQuiz };
}

/** Attempt submission — returns the graded result (with reveal) or null. */
export function useSubmitAttempt(copyOverride?: QuizCopyOverride) {
  const copy = mergeQuizCopy(copyOverride);
  const submitRaw = useMutation(api.features.quiz.attempts.submitAttempt);
  const [isPending, setIsPending] = useState(false);

  const submitAttempt = useCallback(
    async (quizId: Id<"quizzes">, answers: number[]): Promise<AttemptResult | null> => {
      setIsPending(true);
      try {
        return (await submitRaw({ quizId, answers })) as AttemptResult;
      } catch (error) {
        toast.error(quizErrorMessage(error, copy));
        return null;
      } finally {
        setIsPending(false);
      }
    },
    [submitRaw, copy]
  );

  return { submitAttempt, isPending };
}
