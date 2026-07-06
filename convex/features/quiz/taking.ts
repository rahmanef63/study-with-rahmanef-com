// quiz feature — member read surface (QuizTakeView).
// P0 (DATA-MODEL "Catatan keamanan #2", AGENTS.md §6): the taking query MUST
// strip correctIndex AND explanation from every question — answers never reach
// the client before an attempt is graded. Grading is server-side in
// attempts:submitAttempt; explanations come back only in the attempt result.
import { v } from "convex/values";
import { query } from "../../_generated/server";
import { requireUser } from "../../_shared/auth";
import {
  getQuizByModule,
  getQuizOrFail,
  requireMemberForModule,
  requireVisibleCourse,
} from "./access";
import { ATTEMPTS_TAKE } from "./validate";

/**
 * The module's quiz, ANSWER-STRIPPED, for a member to take — or null if the
 * module has no quiz. Draft-course quizzes are invisible to plain members
 * (NOT_FOUND) via requireVisibleCourse. The returned questions carry ONLY
 * { prompt, options } — building the projection explicitly (not delete on a
 * copy) guarantees no answer field can leak.
 */
export const getQuizForTaking = query({
  args: { moduleId: v.id("modules") },
  handler: async (ctx, args) => {
    const { role, module: mod } = await requireMemberForModule(ctx, args.moduleId);
    await requireVisibleCourse(ctx, mod.courseId, role); // draft invisible to member

    const quiz = await getQuizByModule(ctx, args.moduleId);
    if (quiz === null) return null;

    return {
      _id: quiz._id,
      moduleId: quiz.moduleId,
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
