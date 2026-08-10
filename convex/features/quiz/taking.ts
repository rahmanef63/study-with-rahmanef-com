// quiz feature — member read surface (QuizTakeView + the course page's quiz
// list).
// P0 (DATA-MODEL "Catatan keamanan #2", AGENTS.md §6): the taking query MUST
// strip correctIndex AND explanation from every question — answers never reach
// the client before an attempt is graded. Grading is server-side in
// attempts:submitAttempt; explanations come back only in the attempt result.
//
// MIGRATION (DECISIONS #37): a quiz is addressed by its OWN id, not by a
// module. The route is /kuis/<quizId>.
import { v } from "convex/values";
import { query } from "../../_generated/server";
import { requireUser } from "../../_shared/auth";
import {
  assertCourseVisible,
  getQuizOrFail,
  requireMemberForCourse,
  requireMemberForQuiz,
  requireVisibleCourse,
} from "./access";
import { ATTEMPTS_TAKE, MAX_QUIZZES_PER_COURSE } from "./validate";

/**
 * One quiz, ANSWER-STRIPPED, for a member to take. Draft-course quizzes are
 * invisible to plain members (NOT_FOUND) via requireVisibleCourse. The returned
 * questions carry ONLY { prompt, options } — building the projection explicitly
 * (not delete on a copy) guarantees no answer field can leak.
 */
export const getQuizForTaking = query({
  args: { quizId: v.id("quizzes") },
  handler: async (ctx, args) => {
    const { role, quiz } = await requireMemberForQuiz(ctx, args.quizId);
    await requireVisibleCourse(ctx, quiz.courseId, role); // draft invisible to member

    return {
      _id: quiz._id,
      courseId: quiz.courseId,
      tenantId: quiz.tenantId,
      title: quiz.title,
      passingScorePct: quiz.passingScorePct,
      questionCount: quiz.questions.length,
      // SAFE projection — no correctIndex, no explanation.
      questions: quiz.questions.map((q) => ({
        prompt: q.prompt,
        options: q.options,
      })),
    };
  },
});

/**
 * The course's quizzes for the course page — titles and counts only, never a
 * question. Bounded by MAX_QUIZZES_PER_COURSE (the builder enforces the same
 * cap, so the take can never truncate a real course).
 */
export const listQuizzesForCourse = query({
  args: { courseId: v.id("courses") },
  handler: async (ctx, args) => {
    const { role, course } = await requireMemberForCourse(ctx, args.courseId);
    assertCourseVisible(course, role); // draft invisible to member

    const quizzes = await ctx.db
      .query("quizzes")
      .withIndex("by_course", (q) => q.eq("courseId", course._id))
      .take(MAX_QUIZZES_PER_COURSE);

    // Explicit projection — `questions` (which carries the answer key) never
    // enters this payload at all.
    return quizzes.map((quiz) => ({
      _id: quiz._id,
      title: quiz.title,
      passingScorePct: quiz.passingScorePct,
      questionCount: quiz.questions.length,
    }));
  },
});

/**
 * The caller's OWN attempts for a quiz, newest first. Scoped by userId from
 * ctx via by_user_quiz — never returns another member's attempts. Auth before
 * read; no quiz row is touched beyond confirming it exists for a clean 404.
 */
export const listMyAttempts = query({
  args: { quizId: v.id("quizzes") },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx); // auth BEFORE read
    await getQuizOrFail(ctx, args.quizId);

    const attempts = await ctx.db
      .query("quizAttempts")
      .withIndex("by_user_quiz", (q) => q.eq("userId", userId).eq("quizId", args.quizId))
      .take(ATTEMPTS_TAKE);

    return attempts
      .map((a) => ({
        _id: a._id,
        scorePct: a.scorePct,
        passed: a.passed,
        answers: a.answers,
        submittedAt: a._creationTime,
      }))
      .sort((a, b) => b.submittedAt - a.submittedAt);
  },
});
