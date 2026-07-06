"use client";
// quiz slice — read hooks (reactive client state per rr data-fetching rules;
// never fetch in useEffect). Returns are cast to the slice's projection types
// — api.d.ts is untyped until `npx convex dev` regenerates it (docs/STATUS.md
// row #0 note); casts stay valid after codegen.
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import type { MyAttemptRow, QuizManageData, QuizTakingData } from "../types";

/** Answer-stripped quiz for a member to take (null when the module has none). */
export function useQuizForTaking(moduleId: Id<"modules"> | undefined) {
  return useQuery(
    api.features.quiz.taking.getQuizForTaking,
    moduleId === undefined ? "skip" : { moduleId }
  ) as QuizTakingData | null | undefined;
}

/** Full quiz for the builder — instructor+ (null when none yet). */
export function useQuizForManage(moduleId: Id<"modules"> | undefined) {
  return useQuery(
    api.features.quiz.manage.getForManage,
    moduleId === undefined ? "skip" : { moduleId }
  ) as QuizManageData | null | undefined;
}

/** The caller's own attempts for a quiz, newest first. */
export function useMyAttempts(quizId: Id<"quizzes"> | undefined) {
  return useQuery(
    api.features.quiz.taking.listMyAttempts,
    quizId === undefined ? "skip" : { quizId }
  ) as MyAttemptRow[] | undefined;
}
