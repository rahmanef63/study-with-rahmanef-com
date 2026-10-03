import type { Doc, Id } from "../../_generated/dataModel";
import type { QueryCtx } from "../../_generated/server";
import type { UserActivity, UserRow } from "./contract";
import { readBounded, type ReadBudget } from "../analytics";

export const projectActivity = (row: Doc<"userActivityEvents">): UserActivity => ({
  at: row.at, kind: row.kind, path: row.path, viewport: row.viewport,
  ...(row.target ? { target: row.target } : {}),
  ...(row.referrerHost ? { referrerHost: row.referrerHost } : {}),
  ...(row.utmSource ? { utmSource: row.utmSource } : {}),
  ...(row.utmCampaign ? { utmCampaign: row.utmCampaign } : {}),
  ...(row.country ? { country: row.country } : {}), ...(row.city ? { city: row.city } : {}),
  ...(row.browser ? { browser: row.browser } : {}), ...(row.os ? { os: row.os } : {}),
});

export async function loadUserSources(ctx: QueryCtx, userId: Id<"users">, detailed: boolean, budget: ReadBudget = { bytes: 0, rows: 0 }) {
  const limits = detailed
    ? { memberships: 20, completions: 500, reads: 500, badges: 100, attempts: 200 }
    : { memberships: 20, completions: 100, reads: 50, badges: 20, attempts: 50 };
  // Sequential streams share one transaction budget, including every account in a list page.
  const profile = await readBounded(ctx.db.query("profiles").withIndex("by_user", q => q.eq("userId", userId)), budget, 1);
  const memberships = await readBounded(ctx.db.query("memberships").withIndex("by_user", q => q.eq("userId", userId)), budget, limits.memberships);
  const completions = await readBounded(ctx.db.query("lessonCompletions").withIndex("by_user", q => q.eq("userId", userId)).order("desc"), budget, limits.completions);
  const reads = await readBounded(ctx.db.query("materiViews").withIndex("by_user", q => q.eq("userId", userId)).order("desc"), budget, limits.reads);
  const badges = await readBounded(ctx.db.query("courseCompletions").withIndex("by_user", q => q.eq("userId", userId)).order("desc"), budget, limits.badges);
  const attempts = await readBounded(ctx.db.query("quizAttempts").withIndex("by_user", q => q.eq("userId", userId)).order("desc"), budget, limits.attempts);
  const now = Date.now();
  const events = await readBounded(ctx.db.query("userActivityEvents").withIndex("by_user_at", q => q.eq("userId", userId).gte("at", now - 30 * 86_400_000).lte("at", now)).order("desc"), budget, detailed ? 100 : 1);
  return {
    limits, budget, profile: profile.rows[0] ?? null,
    memberships: memberships.rows, completions: completions.rows, reads: reads.rows, badges: badges.rows,
    attempts: attempts.rows, events: events.rows,
    complete: { profile: profile.complete, memberships: memberships.complete, completions: completions.complete,
      reads: reads.complete, badges: badges.complete, attempts: attempts.complete, events: events.complete },
  };
}

export type UserSources = Awaited<ReturnType<typeof loadUserSources>>;

export async function summarizeUser(_ctx: QueryCtx, user: Doc<"users">, sources: UserSources): Promise<UserRow> {
  const profile = sources.profile;
  const times = [sources.completions[0]?._creationTime, sources.reads[0]?._creationTime,
    sources.attempts[0]?._creationTime, sources.badges[0]?._creationTime].filter((value): value is number => value !== undefined);
  return {
    userId: user._id, username: profile?.username.slice(0, 100) ?? null,
    displayName: (profile?.displayName ?? user.name ?? (sources.complete.profile ? "Tanpa profil" : "Profil belum tersedia")).slice(0, 200),
    email: user.email?.slice(0, 320) ?? null, avatarUrl: (profile?.avatarUrl ?? user.image)?.slice(0, 2048) ?? null,
    isPlatformAdmin: profile || sources.complete.profile ? profile?.isPlatformAdmin === true : null, joinedAt: user._creationTime,
    memberships: { value: sources.memberships.length, exact: sources.complete.memberships },
    reads: { value: sources.reads.length, exact: sources.complete.reads },
    lessonsCompleted: { value: new Set(sources.completions.map(row => row.lessonId)).size, exact: sources.complete.completions },
    badges: { value: new Set(sources.badges.map(row => row.courseId)).size, exact: sources.complete.badges },
    quizAttempts: { value: sources.attempts.length, exact: sources.complete.attempts },
    lastLearningAt: times.length ? Math.max(...times) : null,
    status: sources.badges.length ? "memiliki-badge" : times.length ? "belajar"
      : [sources.complete.reads, sources.complete.completions, sources.complete.badges, sources.complete.attempts].every(Boolean) ? "belum-belajar" : "belum-diketahui",
    latestVisit: sources.events[0] ? projectActivity(sources.events[0]) : null,
  };
}
