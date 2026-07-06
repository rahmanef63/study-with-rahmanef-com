// progress feature — the derivation core (docs/DATA-MODEL.md "Derivasi &
// invarian"): course progress is COUNTED from indexes, never stored. Shared by
// the mutation (to decide course completion) and the read query (to render the
// bar + syllabus checks) so both agree on exactly one definition of "done".
import type { Id } from "../../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../../_generated/server";
import { MAX_COMPLETIONS_PER_COURSE, MAX_LESSONS_PER_COURSE } from "./constants";

type Ctx = QueryCtx | MutationCtx;

export type CourseProgress = {
  /** Live lessons the user has completed (for syllabus check marks). */
  completedLessonIds: Id<"lessons">[];
  completedCount: number;
  totalCount: number;
  /** All lessons done AND the course has at least one lesson. */
  isComplete: boolean;
};

/**
 * Count-based progress for one user in one course. Both reads are index-bounded
 * (no bare .collect(), P1). Completions are filtered to lessons that still
 * exist so completedCount can never exceed totalCount (a completed lesson can't
 * be deleted per DATA-MODEL, so this only guards against races).
 */
export async function deriveCourseProgress(
  ctx: Ctx,
  userId: Id<"users">,
  courseId: Id<"courses">
): Promise<CourseProgress> {
  const lessons = await ctx.db
    .query("lessons")
    .withIndex("by_course", (q) => q.eq("courseId", courseId))
    .take(MAX_LESSONS_PER_COURSE);
  const liveLessonIds = new Set(lessons.map((lesson) => lesson._id));

  const completions = await ctx.db
    .query("lessonCompletions")
    .withIndex("by_user_course", (q) => q.eq("userId", userId).eq("courseId", courseId))
    .take(MAX_COMPLETIONS_PER_COURSE);
  const completedLessonIds = completions
    .map((completion) => completion.lessonId)
    .filter((lessonId) => liveLessonIds.has(lessonId));

  const totalCount = lessons.length;
  const completedCount = completedLessonIds.length;
  return {
    completedLessonIds,
    completedCount,
    totalCount,
    isComplete: totalCount > 0 && completedCount >= totalCount,
  };
}

/**
 * Idempotent badge write (DATA-MODEL: courseCompletion "dibuat idempoten … cek
 * by_user_course dulu"). Returns true once a row exists — never inserts twice.
 */
export async function ensureCourseCompletion(
  ctx: MutationCtx,
  args: { tenantId: Id<"tenants">; userId: Id<"users">; courseId: Id<"courses"> }
): Promise<boolean> {
  const existing = await ctx.db
    .query("courseCompletions")
    .withIndex("by_user_course", (q) => q.eq("userId", args.userId).eq("courseId", args.courseId))
    .unique();
  if (existing === null) {
    await ctx.db.insert("courseCompletions", {
      tenantId: args.tenantId,
      userId: args.userId,
      courseId: args.courseId,
    });
  }
  return true;
}
