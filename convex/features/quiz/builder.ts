// quiz feature — builder mutations (instructor+ on the quiz's own tenant, R6).
// P0 contract per handler: v.* validators + authz BEFORE any read/write.
//
// MIGRATION (DECISIONS #37): a quiz is created ON A COURSE. The old "one quiz
// per module" rule died with the module tree; a course may now carry up to
// MAX_QUIZZES_PER_COURSE quizzes, which is also what keeps the course-page read
// bounded. tenantId is DERIVED from the resolved course, never taken from the
// client, and `moduleId` is not written at all any more.
import { v } from "convex/values";
import { mutation } from "../../_generated/server";
import { requireInstructorForCourse, requireInstructorForQuiz } from "./access";
import { fail } from "./errors";
import {
  assertPassingScore,
  assertQuestions,
  assertTitle,
  MAX_QUIZZES_PER_COURSE,
} from "./validate";

/** Convex validator for one MCQ question (matches schema.quizzes.questions). */
const questionValidator = v.object({
  prompt: v.string(),
  options: v.array(v.string()),
  correctIndex: v.number(),
  explanation: v.optional(v.string()),
});

/**
 * Create a quiz on the course. Starts usable immediately — visibility to
 * members is gated by the parent course's status at taking time, not stored
 * here.
 */
export const createQuiz = mutation({
  args: {
    courseId: v.id("courses"),
    title: v.string(),
    passingScorePct: v.number(),
    questions: v.array(questionValidator),
  },
  handler: async (ctx, args) => {
    const { course } = await requireInstructorForCourse(ctx, args.courseId);
    assertTitle(args.title);
    assertPassingScore(args.passingScorePct);
    assertQuestions(args.questions);

    // Bounded by the cap itself (+1 to detect "already at the ceiling"), so
    // this never scans an unbounded quiz list.
    const existing = await ctx.db
      .query("quizzes")
      .withIndex("by_course", (q) => q.eq("courseId", course._id))
      .take(MAX_QUIZZES_PER_COURSE + 1);
    if (existing.length >= MAX_QUIZZES_PER_COURSE) {
      fail("VALIDATION_FAILED", `Maksimal ${MAX_QUIZZES_PER_COURSE} kuis per kelas`);
    }

    return ctx.db.insert("quizzes", {
      tenantId: course.tenantId, // derived — not client-supplied
      courseId: course._id, // derived — not client-supplied
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
