// progress feature — the signed-in reader's whole learning state, in ONE read.
//
// WHY A DEDICATED QUERY AND NOT COMPOSITION. /beranda wants: which communities
// am I in, which courses have I started, how far, how many materi have I
// finished, how many badges. Assembled from the existing surface that is
// `listMine` + `listPublished` per tenant + `getCourseProgress` per course —
// 1 + 3 + 27 subscriptions on the account's home screen, most of them
// re-deriving the same completion set. This does it in a bounded handful.
//
// P0: `requireUser` is the FIRST handler line, so an anonymous caller never
// reaches a read. `userId` is the caller's, resolved from ctx — never an arg.
// Every read is indexed and `take`-bounded; there is no bare `.collect()`.
import { query } from "../../_generated/server";
import type { Doc, Id } from "../../_generated/dataModel";
import { requireUser } from "../../_shared/auth";
import { deriveCourseProgress, type LegacyEligibility } from "./derive";

/**
 * Read ceilings, declared locally on purpose — progress must NOT deep-import
 * the courses or tenants features (cross-slice coupling resolves through shared
 * tables only). Ten courses read at most 2,000 completion index ranges, plus
 * small placement snapshots. One shared cache caps legacy full-body reads at 10.
 */
const MAX_COMMUNITIES = 20;
/** Published courses examined per community. */
const MAX_COURSES_PER_COMMUNITY = 30;
/** Total courses examined across ALL communities — the real bound. A reader in
 *  twenty communities must not turn their home screen into a hundred reads. */
const MAX_COURSES_TOTAL = 10;
// ponytail: summarize 10 courses; paginate if learners regularly exceed this roster.
/** One row per finished materi, ever. Above this the counts read "N+". */
const MAX_COMPLETIONS = 500;
/** One row per finished course, ever. */
const MAX_BADGES = 100;

export type OverviewCourse = {
  courseId: Id<"courses">;
  slug: string;
  title: string;
  communitySlug: string;
  communityName: string;
  /** Materi placed in this course. */
  total: number;
  /** …of which the caller has finished. */
  done: number;
  /** 0-100, derived on read. Percentages are never stored. */
  percent: number;
};

export type OverviewCommunity = {
  slug: string;
  name: string;
  role: "owner" | "instructor" | "member";
  /** Published courses in it. */
  courseCount: number;
};

/**
 * Everything /beranda renders, for the caller only.
 *
 * `inProgress` is deliberately NOT every course: a home screen's job is to
 * answer "what was I doing", so it carries the started-but-unfinished ones,
 * most-progressed first. `notStarted` is the next thing to pick up.
 */
export const getMine = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);

    // Only a COMPLETE scan can answer per-course membership correctly. Past
    // this cap, deriveCourseProgress falls back to indexed point lookups.
    const completions = await ctx.db
      .query("lessonCompletions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .take(MAX_COMPLETIONS + 1);
    const finished = completions.length <= MAX_COMPLETIONS
      ? new Set<string>(completions.map((c) => c.lessonId)) : undefined;

    const badges = await ctx.db
      .query("courseCompletions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .take(MAX_BADGES + 1);
    const badgeCourseIds = new Set<string>(badges.slice(0, MAX_BADGES).map((b) => b.courseId));

    const memberships = await ctx.db
      .query("memberships")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .take(MAX_COMMUNITIES + 1);

    const communities: OverviewCommunity[] = [];
    const courses: OverviewCourse[] = [];
    const legacyEligibility: LegacyEligibility = new Map();
    let examined = 0;
    let truncated = completions.length > MAX_COMPLETIONS || badges.length > MAX_BADGES ||
      memberships.length > MAX_COMMUNITIES;

    for (const membership of memberships.slice(0, MAX_COMMUNITIES)) {
      const tenant: Doc<"tenants"> | null = await ctx.db.get(membership.tenantId);
      // Same rule listMine holds: pending and suspended communities stay
      // invisible, so a home screen never advertises one you cannot open.
      if (tenant === null || tenant.status !== "active") continue;

      const published = await ctx.db
        .query("courses")
        .withIndex("by_tenant_status", (q) =>
          q.eq("tenantId", tenant._id).eq("status", "published")
        )
        .take(MAX_COURSES_PER_COMMUNITY + 1);
      if (published.length > MAX_COURSES_PER_COMMUNITY) truncated = true;

      communities.push({
        slug: tenant.slug,
        name: tenant.name,
        role: membership.role,
        courseCount: Math.min(published.length, MAX_COURSES_PER_COMMUNITY),
      });

      for (const course of published.slice(0, MAX_COURSES_PER_COMMUNITY)) {
        if (examined >= MAX_COURSES_TOTAL) { truncated = true; break; }
        examined += 1;
        const progress = await deriveCourseProgress(ctx, userId, course._id, finished, legacyEligibility);
        if (progress.truncated) { truncated = true; continue; }
        const { totalCount: total, completedCount: done } = progress;
        if (total === 0) continue;
        courses.push({
          courseId: course._id,
          slug: course.slug,
          title: course.title,
          communitySlug: tenant.slug,
          communityName: tenant.name,
          total,
          done,
          percent: Math.round((done / total) * 100),
        });
      }
    }

    // Most-progressed first so "lanjutkan" points at the thing nearest done.
    const inProgress = courses
      .filter((c) => c.done > 0 && c.done < c.total)
      .sort((a, b) => b.percent - a.percent);
    const notStarted = courses.filter((c) => c.done === 0);

    return {
      communities,
      inProgress,
      notStarted,
      /** Courses whose every materi is finished — the badge wall's population. */
      completedCount: courses.filter((c) => c.total > 0 && c.done === c.total).length,
      badgeCount: badgeCourseIds.size,
      materiDone: Math.min(completions.length, MAX_COMPLETIONS),
      /** True only when rows were actually omitted, not just at an exact cap. */
      truncated,
    };
  },
});
