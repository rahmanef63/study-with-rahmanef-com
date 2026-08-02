// quiz feature — submitAttempt (member). Grades SERVER-SIDE (P0: answers are
// never trusted from, nor revealed to, the client pre-submit), stores the
// attempt, then returns the score + per-question correctness + explanations —
// the ONLY point at which correctIndex/explanation reach the member.
import { v } from "convex/values";
import { mutation } from "../../_generated/server";
import { requireMemberForQuiz, requireVisibleCourse } from "./access";
import { didPass, gradeAttempt } from "./grade";
import { assertAnswers } from "./validate";

export const submitAttempt = mutation({
  args: {
    quizId: v.id("quizzes"),
    answers: v.array(v.number()),
  },
  handler: async (ctx, args) => {
    const { userId, role, quiz } = await requireMemberForQuiz(ctx, args.quizId);
    await requireVisibleCourse(ctx, quiz.courseId, role); // draft invisible to member
    assertAnswers(args.answers, quiz.questions);

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

    // Post-submission reveal: correctness + explanations per question.
    const results = quiz.questions.map((q, i) => ({
      questionIndex: i,
      yourAnswer: args.answers[i],
      correctIndex: q.correctIndex,
      isCorrect: args.answers[i] === q.correctIndex,
      explanation: q.explanation,
    }));

    return {
      attemptId,
      scorePct,
      passed,
      correctCount,
      totalQuestions: quiz.questions.length,
      passingScorePct: quiz.passingScorePct,
      results,
    };
  },
});
