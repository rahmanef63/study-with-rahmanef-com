// analytics feature — derivation core. Every number here is COUNTED from
// indexes on read, never stored (docs/DATA-MODEL.md "Derivasi & invarian";
// assignment #17: "All counts derived — never stored"). No new tables: this
// feature reads the shared progress/quiz/membership tables directly, the
// sanctioned precedent being convex/features/progress (shared-table reads are
// table access, not code imports). Outputs carry NO user identifiers — counts
// only — so nothing PII-shaped can leak past the instructor gate.
//
// MATERI MODEL (DECISIONS #36/#37): module grouping is gone. A course is a FLAT
// ordered list of materi (`courseLessons`), and a quiz hangs off the COURSE.
import type { Doc, Id } from "../../_generated/dataModel";
import type { QueryCtx } from "../../_generated/server";
import {
  MAX_ATTEMPTS_PER_QUIZ_SCAN,
  MAX_BADGES_PER_USER_SCAN,
  MAX_COMPLETIONS_PER_USER_SCAN,
  MAX_MEMBERSHIPS_SCAN,
  MAX_QUIZZES_PER_COURSE_SCAN,
} from "./constants";

/** One materi's completion count, positioned by its place in the course. */
export type LessonCompletionStat = {
  lessonId: Id<"lessons">;
  title: string;
  /** courseLessons.order — position in THIS course, not a global rank. */
  order: number;
  completedCount: number;
};

/** One quiz's attempt stats. Quizzes belong to the course (no module tree). */
export type CourseQuizStat = {
  quizId: Id<"quizzes">;
  quizTitle: string;
  attemptCount: number;
  passCount: number;
  /** Rounded percentage; 0 when there are no attempts yet. */
  passRatePct: number;
};

/** All memberships of a tenant (every role), bounded. Length = member count. */
export async function listTenantMemberships(
  ctx: QueryCtx,
  tenantId: Id<"tenants">
): Promise<Doc<"memberships">[]> {
  return await ctx.db
    .query("memberships")
    .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
    .take(MAX_MEMBERSHIPS_SCAN);
}

/**
 * lessonId → how many CURRENT members completed it, restricted to `lessonIds`
 * (one course's roster).
 *
 * Derived per member via lessonCompletions.by_user, mirroring
 * countBadgesByCourse below. It cannot go through the completion's own
 * `courseId` any more: that column is optional PROVENANCE now, empty whenever a
 * materi is taught in more than one course. Each member is counted AT MOST ONCE
 * per materi — a duplicate legacy row must not inflate the bar.
 * Known floor: completions of users who since LEFT the tenant are not counted.
 */
export async function countCompletionsPerLesson(
  ctx: QueryCtx,
  memberships: Doc<"memberships">[],
  lessonIds: Id<"lessons">[]
): Promise<Map<Id<"lessons">, number>> {
  const wanted = new Set<Id<"lessons">>(lessonIds);
  const counts = new Map<Id<"lessons">, number>();
  if (wanted.size === 0) return counts;
  for (const membership of memberships) {
    const completions = await ctx.db
      .query("lessonCompletions")
      .withIndex("by_user", (q) => q.eq("userId", membership.userId))
      .take(MAX_COMPLETIONS_PER_USER_SCAN);
    const seen = new Set<Id<"lessons">>();
    for (const completion of completions) {
      if (!wanted.has(completion.lessonId) || seen.has(completion.lessonId)) continue;
      seen.add(completion.lessonId);
      counts.set(completion.lessonId, (counts.get(completion.lessonId) ?? 0) + 1);
    }
  }
  return counts;
}

/**
 * courseId → badge (courseCompletions) count, derived per CURRENT member via
 * the by_user index and bucketed to the requested courses. One bounded take
 * per member — courseCompletions has no by_course index today, so this is the
 * exact-count path that stays inside existing indexes. Known floor: badges of
 * users who since LEFT the tenant are not counted.
 * // TODO(rr): waiting on schema index courseCompletions.by_course (proposal
 * // to alpha) — would make this one scan and count ex-members' badges too.
 */
export async function countBadgesByCourse(
  ctx: QueryCtx,
  memberships: Doc<"memberships">[],
  courseIds: Id<"courses">[]
): Promise<Map<Id<"courses">, number>> {
  const wanted = new Set<Id<"courses">>(courseIds);
  const counts = new Map<Id<"courses">, number>();
  for (const membership of memberships) {
    const badges = await ctx.db
      .query("courseCompletions")
      .withIndex("by_user", (q) => q.eq("userId", membership.userId))
      .take(MAX_BADGES_PER_USER_SCAN);
    for (const badge of badges) {
      if (wanted.has(badge.courseId)) {
        counts.set(badge.courseId, (counts.get(badge.courseId) ?? 0) + 1);
      }
    }
  }
  return counts;
}

/**
 * Quiz stats for one COURSE: attempts + passes via by_quiz, rate computed
 * in-handler. Keyed on the course because a quiz belongs to one (DECISIONS #37);
 * the dashboard lists a course's quizzes flat, in creation order.
 */
export async function quizStatsForCourse(
  ctx: QueryCtx,
  courseId: Id<"courses">
): Promise<CourseQuizStat[]> {
  const quizzes = await ctx.db
    .query("quizzes")
    .withIndex("by_course", (q) => q.eq("courseId", courseId))
    .take(MAX_QUIZZES_PER_COURSE_SCAN);

  const stats: CourseQuizStat[] = [];
  for (const quiz of quizzes) {
    const attempts = await ctx.db
      .query("quizAttempts")
      .withIndex("by_quiz", (q) => q.eq("quizId", quiz._id))
      .take(MAX_ATTEMPTS_PER_QUIZ_SCAN);
    const attemptCount = attempts.length;
    const passCount = attempts.filter((attempt) => attempt.passed).length;
    stats.push({
      quizId: quiz._id,
      quizTitle: quiz.title,
      attemptCount,
      passCount,
      passRatePct: attemptCount === 0 ? 0 : Math.round((passCount / attemptCount) * 100),
    });
  }
  return stats;
}
