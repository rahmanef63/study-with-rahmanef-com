// quiz feature — submitAttempt (member). Grades SERVER-SIDE (P0: answers are
// never trusted from, nor revealed to, the client pre-submit), stores the
// attempt, then returns the score + per-question correctness. The answer KEY
// (correctIndex/explanation) is withheld until the attempt can no longer be
// gamed — see REVEAL below.
import { v } from "convex/values";
import { mutation } from "../../_generated/server";
import { requireMemberForQuiz, requireVisibleCourse } from "./access";
import { fail } from "./errors";
import { didPass, gradeAttempt } from "./grade";
import { assertAnswers } from "./validate";

// Cap attempts per user per quiz. Without it, `passed` — which is what marks a
// module lulus — could be farmed by resubmitting indefinitely.
export const MAX_ATTEMPTS_PER_QUIZ = 5;

export const submitAttempt = mutation({
  args: {
    quizId: v.id("quizzes"),
    answers: v.array(v.number()),
  },
  handler: async (ctx, args) => {
    const { userId, role, quiz } = await requireMemberForQuiz(ctx, args.quizId);
    await requireVisibleCourse(ctx, quiz.courseId, role); // draft invisible to member
    assertAnswers(args.answers, quiz.questions);

    // Bounded by the cap itself (+1 to detect "already over"), so this never
    // scans an unbounded attempt history.
    const prior = await ctx.db
      .query("quizAttempts")
      .withIndex("by_user_quiz", (q) => q.eq("userId", userId).eq("quizId", quiz._id))
      .take(MAX_ATTEMPTS_PER_QUIZ + 1);
    if (prior.length >= MAX_ATTEMPTS_PER_QUIZ) {
      fail(
        "RATE_LIMITED",
        `Maksimal ${MAX_ATTEMPTS_PER_QUIZ} percobaan untuk kuis ini — pelajari lagi materinya ya`
      );
    }

    const { correctCount, scorePct } = gradeAttempt(quiz.questions, args.answers);
    const passed = didPass(scorePct, quiz.passingScorePct);

    const attemptId = await ctx.db.insert("quizAttempts", {
      tenantId: quiz.tenantId,
      userId,
      quizId: quiz._id,
      answers: args.answers,
      scorePct,
      passed,
    });

    // REVEAL gate. Handing back the full key on a failed attempt let a member
    // submit garbage once, read every correctIndex, and resubmit perfectly — so
    // the key only comes out when it can no longer buy a better score: the
    // attempt passed, the member already passed earlier, or this was the last
    // allowed try. `isCorrect` is always safe (it is the score, per question).
    const alreadyPassed = prior.some((a) => a.passed);
    const isLastAttempt = prior.length + 1 >= MAX_ATTEMPTS_PER_QUIZ;
    const reveal = passed || alreadyPassed || isLastAttempt;

    const results = quiz.questions.map((q, i) => ({
      questionIndex: i,
      yourAnswer: args.answers[i],
      correctIndex: reveal ? q.correctIndex : undefined,
      isCorrect: args.answers[i] === q.correctIndex,
      explanation: reveal ? q.explanation : undefined,
    }));

    return {
      attemptId,
      scorePct,
      passed,
      correctCount,
      totalQuestions: quiz.questions.length,
      passingScorePct: quiz.passingScorePct,
      attemptsUsed: prior.length + 1,
      attemptsAllowed: MAX_ATTEMPTS_PER_QUIZ,
      keyRevealed: reveal,
      results,
    };
  },
});
