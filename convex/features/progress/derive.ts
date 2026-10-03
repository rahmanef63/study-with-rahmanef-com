// progress feature — the derivation core (docs/DATA-MODEL.md "Derivasi &
// invarian"): course progress is COUNTED from indexes, never stored. Shared by
// the mutation (to decide course completion) and the read query (to render the
// bar + syllabus checks) so both agree on exactly one definition of "done".
//
// MATERI MODEL (DECISIONS #36/#37). A completion is keyed on (userId, lessonId)
// ONLY. The roster of a course is `courseLessons`, not `lessons.courseId`, so
// course progress uses existing published materi in the course's own tenant.
// Keeping courseId in the completion key would ask someone who finished "sub
// agents" in Claude Code to finish it again in Hermes, and would double-count
// their progress — see the note on `lessonCompletions` in _tables/learning.ts.
import type { Doc, Id } from "../../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../../_generated/server";
import { MAX_COURSES_PER_LESSON, MAX_LEGACY_LESSON_READS, MAX_LESSONS_PER_COURSE } from "./constants";

type Ctx = QueryCtx | MutationCtx;

export type CourseProgress = {
  /** Live lessons the user has completed (for syllabus check marks). */
  completedLessonIds: Id<"lessons">[];
  completedCount: number;
  totalCount: number;
  /** All lessons done AND the course has at least one lesson. */
  isComplete: boolean;
  /** Missing eligibility metadata or an oversized legacy roster makes counts incomplete. */
  truncated?: boolean;
};

/** Share this cache across all courses in a transaction, never across users. */
export type LegacyEligibility = Map<Id<"lessons">, { tenantId: Id<"tenants">; published: boolean } | null>;

/** Teaching order, plus one sentinel placement to detect legacy overflow. */
export async function listCoursePlacements(
  ctx: Ctx,
  courseId: Id<"courses">
): Promise<Doc<"courseLessons">[]> {
  return await ctx.db
    .query("courseLessons")
    .withIndex("by_course", (q) => q.eq("courseId", courseId))
    .take(MAX_LESSONS_PER_COURSE + 1);
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
 * "completed", never crash a progress read. The overview may pass a COMPLETE
 * completion set to reuse its bounded scan; a truncated scan must never be passed.
 */
export async function deriveCourseProgress(
  ctx: Ctx,
  userId: Id<"users">,
  courseId: Id<"courses">,
  completedLessons?: ReadonlySet<string>,
  legacyEligibility: LegacyEligibility = new Map(),
  maxLegacyReads = MAX_LEGACY_LESSON_READS
): Promise<CourseProgress> {
  const course = await ctx.db.get(courseId);
  const roster = course === null ? [] : await listCoursePlacements(ctx, courseId);
  const placements: Doc<"courseLessons">[] = [];
  let truncated = roster.length > MAX_LESSONS_PER_COURSE;
  for (const placement of roster.slice(0, MAX_LESSONS_PER_COURSE)) {
    if (placement.tenantId !== course?.tenantId) continue;
    if (placement.lessonPublished !== undefined) {
      if (placement.lessonPublished) placements.push(placement);
      continue;
    }
    if (!legacyEligibility.has(placement.lessonId)) {
      if (legacyEligibility.size >= Math.min(maxLegacyReads, MAX_LEGACY_LESSON_READS)) { truncated = true; continue; }
      const lesson = await ctx.db.get(placement.lessonId);
      legacyEligibility.set(placement.lessonId, lesson === null ? null : {
        tenantId: lesson.tenantId, published: (lesson.status ?? "published") === "published",
      });
    }
    const lesson = legacyEligibility.get(placement.lessonId);
    if (lesson?.tenantId === course?.tenantId && lesson?.published) placements.push(placement);
  }
  const flags = await Promise.all(
    placements.map(async (placement) => {
      if (completedLessons !== undefined) return completedLessons.has(placement.lessonId);
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
    isComplete: !truncated && totalCount > 0 && completedCount >= totalCount,
    ...(truncated ? { truncated: true } : {}),
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
