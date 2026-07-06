// quiz feature — builder mutations (instructor+ on the quiz's own tenant, R6).
// P0 contract per handler: v.* validators + authz BEFORE any read/write.
// One quiz per module for v1 (check by_module first). tenantId/courseId are
// DERIVED from the resolved module, never taken from the client.
import { v } from "convex/values";
import { mutation } from "../../_generated/server";
import {
  getQuizByModule,
  requireInstructorForModule,
  requireInstructorForQuiz,
} from "./access";
import { fail } from "./errors";
import { assertPassingScore, assertQuestions, assertTitle } from "./validate";

/** Convex validator for one MCQ question (matches schema.quizzes.questions). */
const questionValidator = v.object({
  prompt: v.string(),
  options: v.array(v.string()),
  correctIndex: v.number(),
  explanation: v.optional(v.string()),
});

/**
 * Create the module's quiz. VALIDATION_FAILED if one already exists (v1 = one
 * quiz per module). Starts usable immediately — visibility to members is gated
 * by the parent course's status at taking time, not stored here.
 */
export const createQuiz = mutation({
  args: {
    moduleId: v.id("modules"),
    title: v.string(),
    passingScorePct: v.number(),
    questions: v.array(questionValidator),
  },
  handler: async (ctx, args) => {
    const { module: mod } = await requireInstructorForModule(ctx, args.moduleId);
    assertTitle(args.title);
    assertPassingScore(args.passingScorePct);
    assertQuestions(args.questions);

    const existing = await getQuizByModule(ctx, args.moduleId);
    if (existing !== null) {
      fail("VALIDATION_FAILED", "Modul ini sudah punya kuis");
    }

    return ctx.db.insert("quizzes", {
      tenantId: mod.tenantId, // derived — not client-supplied
      courseId: mod.courseId, // derived — not client-supplied
      moduleId: mod._id,
      title: args.title.trim(),
      passingScorePct: args.passingScorePct,
      questions: args.questions,
    });
  },
});

/** Replace the quiz's title / passing score / questions (instructor+). */
export const updateQuiz = mutation({
  args: {
    quizId: v.id("quizzes"),
    title: v.optional(v.string()),
    passingScorePct: v.optional(v.number()),
    questions: v.optional(v.array(questionValidator)),
  },
  handler: async (ctx, args) => {
    const { quiz } = await requireInstructorForQuiz(ctx, args.quizId);

    const patch: Record<string, unknown> = {};
    if (args.title !== undefined) {
      assertTitle(args.title);
      patch.title = args.title.trim();
    }
    if (args.passingScorePct !== undefined) {
      assertPassingScore(args.passingScorePct);
      patch.passingScorePct = args.passingScorePct;
    }
    if (args.questions !== undefined) {
      assertQuestions(args.questions);
      patch.questions = args.questions;
    }
    if (Object.keys(patch).length === 0) {
      fail("VALIDATION_FAILED", "Tidak ada perubahan untuk disimpan");
    }
    await ctx.db.patch(quiz._id, patch);
    return quiz._id;
  },
});

/**
 * Delete the quiz — only when it has NO attempts (preserves member history:
 * an attempt must always resolve to a real quiz). Single indexed .first()
 * probe, bounded.
 */
export const deleteQuiz = mutation({
  args: { quizId: v.id("quizzes") },
  handler: async (ctx, args) => {
    const { quiz } = await requireInstructorForQuiz(ctx, args.quizId);
    const anyAttempt = await ctx.db
      .query("quizAttempts")
      .withIndex("by_quiz", (q) => q.eq("quizId", quiz._id))
      .first();
    if (anyAttempt !== null) {
      fail("VALIDATION_FAILED", "Kuis sudah pernah dikerjakan — tidak bisa dihapus");
    }
    await ctx.db.delete(quiz._id);
    return quiz._id;
  },
});
