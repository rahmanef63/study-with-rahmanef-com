"use client";
// quiz slice — read hooks (reactive client state per rr data-fetching rules;
// never fetch in useEffect). Returns are cast to the slice's projection types.
//
// MIGRATION (DECISIONS #37): a quiz is addressed by its OWN id. A course's
// quizzes are discovered with useQuizzesForCourse, then opened by quizId.
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import type { CourseQuizRow, MyAttemptRow, QuizManageData, QuizTakingData } from "../types";

/** Answer-stripped quiz for a member to take. */
export function useQuizForTaking(quizId: Id<"quizzes"> | undefined) {
  return useQuery(
    api.features.quiz.taking.getQuizForTaking,
    quizId === undefined ? "skip" : { quizId }
  ) as QuizTakingData | undefined;
}

/** A course's quizzes — titles/counts only, member+ (instructor+ sees drafts). */
export function useQuizzesForCourse(courseId: Id<"courses"> | undefined | null) {
  return useQuery(
    api.features.quiz.taking.listQuizzesForCourse,
    courseId == null ? "skip" : { courseId }
  ) as CourseQuizRow[] | undefined;
}

/** Full quiz for the builder — instructor+. */
export function useQuizForManage(quizId: Id<"quizzes"> | undefined) {
  return useQuery(
    api.features.quiz.manage.getForManage,
    quizId === undefined ? "skip" : { quizId }
  ) as QuizManageData | undefined;
}

/** The caller's own attempts for a quiz, newest first. */
export function useMyAttempts(quizId: Id<"quizzes"> | undefined) {
  return useQuery(
    api.features.quiz.taking.listMyAttempts,
    quizId === undefined ? "skip" : { quizId }
  ) as MyAttemptRow[] | undefined;
}
