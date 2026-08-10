// progress feature — the derivation core (docs/DATA-MODEL.md "Derivasi &
// invarian"): course progress is COUNTED from indexes, never stored. Shared by
// the mutation (to decide course completion) and the read query (to render the
// bar + syllabus checks) so both agree on exactly one definition of "done".
//
// MATERI MODEL (DECISIONS #36/#37). A completion is keyed on (userId, lessonId)
// ONLY. The roster of a course is `courseLessons`, not `lessons.courseId`, so
// course progress = |completions ∩ courseLessons(courseId)| / |courseLessons|.
// Keeping courseId in the completion key would ask someone who finished "sub
// agents" in Claude Code to finish it again in Hermes, and would double-count
// their progress — see the note on `lessonCompletions` in _tables/learning.ts.
import type { Doc, Id } from "../../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../../_generated/server";
import { MAX_COURSES_PER_LESSON, MAX_LESSONS_PER_COURSE } from "./constants";

type Ctx = QueryCtx | MutationCtx;

export type CourseProgress = {
  /** Live lessons the user has completed (for syllabus check marks). */
  completedLessonIds: Id<"lessons">[];
  completedCount: number;
  totalCount: number;
  /** All lessons done AND the course has at least one lesson. */
  isComplete: boolean;
};

/** A course's materi roster, in teaching order (by_course = [courseId, order]). */
export async function listCoursePlacements(
  ctx: Ctx,
  courseId: Id<"courses">
): Promise<Doc<"courseLessons">[]> {
  return await ctx.db
    .query("courseLessons")
    .withIndex("by_course", (q) => q.eq("courseId", courseId))
    .take(MAX_LESSONS_PER_COURSE);
}

/** The backlink: every course this materi is taught in. Empty is legitimate —
 *  a materi can live in the library without belonging to any course. */
export async function listLessonPlacements(
  ctx: Ctx,
  lessonId: Id<"lessons">
): Promise<Doc<"courseLessons">[]> {
  return await ctx.db
    .query("courseLessons")
    .withIndex("by_lesson", (q) => q.eq("lessonId", lessonId))
    .take(MAX_COURSES_PER_LESSON);
}

/**
 * Count-based progress for one user in one course. Every read is
 * index-bounded (no bare .collect(), P1): one range read for the roster, then
 * one by_user_lesson point lookup per placement. Cost is O(course size) and
 * independent of how much the user has completed elsewhere — the alternative
 * (scanning the user's completions and intersecting) would silently FLOOR the
 * count for a heavy learner once their history outgrew the scan cap.
 * `.first()` rather than `.unique()`: a duplicate legacy row must degrade to
 * "completed", never crash a progress read.
 */
export async function deriveCourseProgress(
  ctx: Ctx,
  userId: Id<"users">,
  courseId: Id<"courses">
): Promise<CourseProgress> {
  const placements = await listCoursePlacements(ctx, courseId);
  const flags = await Promise.all(
    placements.map(async (placement) => {
      const completion = await ctx.db
        .query("lessonCompletions")
        .withIndex("by_user_lesson", (q) =>
          q.eq("userId", userId).eq("lessonId", placement.lessonId)
        )
        .first();
      return completion !== null;
    })
  );

  const completedLessonIds = placements
    .filter((_, index) => flags[index])
    .map((placement) => placement.lessonId);
  const totalCount = placements.length;
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
