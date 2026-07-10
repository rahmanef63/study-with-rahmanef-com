// analytics feature — derivation core. Every number here is COUNTED from
// indexes on read, never stored (docs/DATA-MODEL.md "Derivasi & invarian";
// assignment #17: "All counts derived — never stored"). No new tables: this
// feature reads the shared progress/quiz/membership tables directly, the
// sanctioned precedent being convex/features/progress (shared-table reads are
// table access, not code imports). Outputs carry NO user identifiers — counts
// only — so nothing PII-shaped can leak past the instructor gate.
import type { Doc, Id } from "../../_generated/dataModel";
import type { QueryCtx } from "../../_generated/server";
import {
  MAX_ATTEMPTS_PER_QUIZ_SCAN,
  MAX_BADGES_PER_USER_SCAN,
  MAX_LESSON_COMPLETIONS_SCAN,
  MAX_MEMBERSHIPS_SCAN,
  MAX_QUIZZES_PER_MODULE_SCAN,
} from "./constants";

/** One lesson's completion count, with module context for grouped display. */
export type LessonCompletionStat = {
  lessonId: Id<"lessons">;
  title: string;
  order: number;
  moduleId: Id<"modules">;
  moduleTitle: string;
  moduleOrder: number;
  completedCount: number;
};

/** One quiz's attempt stats (quizzes hang off modules — builder: 1/module). */
export type ModuleQuizStat = {
  moduleId: Id<"modules">;
  moduleTitle: string;
  moduleOrder: number;
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

/** lessonId → completion count for one course (single bounded index scan). */
export async function countCompletionsPerLesson(
  ctx: QueryCtx,
  courseId: Id<"courses">
): Promise<Map<Id<"lessons">, number>> {
  const completions = await ctx.db
    .query("lessonCompletions")
    .withIndex("by_course", (q) => q.eq("courseId", courseId))
    .take(MAX_LESSON_COMPLETIONS_SCAN);
  const counts = new Map<Id<"lessons">, number>();
  for (const completion of completions) {
    counts.set(completion.lessonId, (counts.get(completion.lessonId) ?? 0) + 1);
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
 * Quiz stats for a course's modules: attempts + passes via by_quiz, rate
 * computed in-handler. `modules` must already be sorted by `order` (the
 * caller sorts once and reuses the sorted list for lessons too).
 */
export async function quizStatsForModules(
  ctx: QueryCtx,
  modules: Doc<"modules">[]
): Promise<ModuleQuizStat[]> {
  const stats: ModuleQuizStat[] = [];
  for (const mod of modules) {
    const quizzes = await ctx.db
      .query("quizzes")
      .withIndex("by_module", (q) => q.eq("moduleId", mod._id))
      .take(MAX_QUIZZES_PER_MODULE_SCAN);
    for (const quiz of quizzes) {
      const attempts = await ctx.db
        .query("quizAttempts")
        .withIndex("by_quiz", (q) => q.eq("quizId", quiz._id))
        .take(MAX_ATTEMPTS_PER_QUIZ_SCAN);
      const attemptCount = attempts.length;
      const passCount = attempts.filter((attempt) => attempt.passed).length;
      stats.push({
        moduleId: mod._id,
        moduleTitle: mod.title,
        moduleOrder: mod.order,
        quizId: quiz._id,
        quizTitle: quiz.title,
        attemptCount,
        passCount,
        passRatePct: attemptCount === 0 ? 0 : Math.round((passCount / attemptCount) * 100),
      });
    }
  }
  return stats;
}
