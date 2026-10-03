import type { Doc } from "../../_generated/dataModel";
import type { QueryCtx } from "../../_generated/server";
import { deriveCourseProgress, type LegacyEligibility } from "../progress";
import type { UserDetail } from "./contract";
import { projectActivity, summarizeUser, type UserSources } from "./read";
import { readBounded } from "../analytics";

/** Eligible course derivation is shared with the learner surface, never inferred from badge totals. */
export async function buildUserDetail(ctx: QueryCtx, user: Doc<"users">, sources: UserSources): Promise<UserDetail> {
  const summary = await summarizeUser(ctx, user, sources);
  let complete = [summary.memberships, summary.reads, summary.lessonsCompleted, summary.badges, summary.quizAttempts].every(count => count.exact);
  const communities: UserDetail["communities"] = [];
  const courses: UserDetail["courses"] = [];
  const finished = summary.lessonsCompleted.exact ? new Set<string>(sources.completions.map(row => row.lessonId)) : undefined;
  const legacy: LegacyEligibility = new Map();
  for (const membership of sources.memberships.slice(0, sources.limits.memberships)) {
    if (sources.budget.bytes >= 3 * 1024 * 1024) { complete = false; break; }
    const tenant = await ctx.db.get(membership.tenantId);
    if (!tenant) { complete = false; continue; }
    sources.budget.bytes += JSON.stringify(tenant).length * 3;
    sources.budget.rows++;
    communities.push({ tenantId: tenant._id, slug: tenant.slug.slice(0, 100), name: tenant.name.slice(0, 200), status: tenant.status, role: membership.role, joinedAt: membership._creationTime });
    if (tenant.status !== "active") continue;
    const published = await readBounded(ctx.db.query("courses").withIndex("by_tenant_status", q => q.eq("tenantId", tenant._id).eq("status", "published")), sources.budget, 20);
    if (!published.complete) complete = false;
    for (const course of published.rows) {
      if (courses.length >= 20) { complete = false; break; }
      const progress = await deriveCourseProgress(ctx, user._id, course._id, finished, legacy, 3);
      const badge = await ctx.db.query("courseCompletions").withIndex("by_user_course", q => q.eq("userId", user._id).eq("courseId", course._id)).first();
      const exact = progress.truncated !== true;
      if (!exact) complete = false;
      courses.push({
        courseId: course._id, slug: course.slug.slice(0, 100), title: course.title.slice(0, 200),
        communitySlug: tenant.slug.slice(0, 100), communityName: tenant.name.slice(0, 200),
        total: progress.totalCount, done: progress.completedCount,
        percent: exact ? (progress.totalCount ? Math.round(100 * progress.completedCount / progress.totalCount) : 0) : null,
        isComplete: progress.isComplete, complete: exact, badge: badge !== null,
      });
    }
  }
  const slugs = new Map(communities.map(row => [row.tenantId, row.slug]));
  // Labels are optional; history counts remain accurate even when content is deleted or too large to join.
  let labelBytes = 0;
  const lessonLabels = new Map<string, string>();
  for (const row of sources.reads.slice(0, 20)) {
    if (labelBytes >= 524_288 || lessonLabels.has(row.lessonId)) continue;
    const lesson = await ctx.db.get(row.lessonId);
    if (lesson) { labelBytes += JSON.stringify(lesson).length * 3; lessonLabels.set(row.lessonId, lesson.title.slice(0, 200)); }
  }
  const quizLabels = new Map<string, string>();
  for (const row of sources.attempts.slice(0, 20)) {
    if (labelBytes >= 524_288 || quizLabels.has(row.quizId)) continue;
    const quiz = await ctx.db.get(row.quizId);
    if (quiz) { labelBytes += JSON.stringify(quiz).length * 3; quizLabels.set(row.quizId, quiz.title.slice(0, 200)); }
  }
  return {
    user: summary, communities, courses,
    reads: sources.reads.slice(0, sources.limits.reads).map(row => ({
      lessonId: row.lessonId, day: row.day, at: row._creationTime,
      ...(lessonLabels.has(row.lessonId) ? { title: lessonLabels.get(row.lessonId)! } : {}),
      ...(slugs.has(row.tenantId) ? { communitySlug: slugs.get(row.tenantId)! } : {}),
    })),
    quizzes: sources.attempts.slice(0, sources.limits.attempts).map(row => ({
      quizId: row.quizId, scorePct: row.scorePct, passed: row.passed, at: row._creationTime,
      ...(quizLabels.has(row.quizId) ? { title: quizLabels.get(row.quizId)! } : {}),
      ...(slugs.has(row.tenantId) ? { communitySlug: slugs.get(row.tenantId)! } : {}),
    })),
    activity: sources.events.slice(0, 100).map(projectActivity), complete,
    activityComplete: sources.complete.events,
  };
}
