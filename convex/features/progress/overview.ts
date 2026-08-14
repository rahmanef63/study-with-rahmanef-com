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
import { MAX_LESSONS_PER_COURSE } from "./constants";

/**
 * Read ceilings, declared locally on purpose — progress must NOT deep-import
 * the courses or tenants features (cross-slice coupling resolves through shared
 * tables only). Chosen so the worst case is ~1 + T + C indexed reads.
 */
const MAX_COMMUNITIES = 20;
/** Published courses examined per community. */
const MAX_COURSES_PER_COMMUNITY = 30;
/** Total courses examined across ALL communities — the real bound. A reader in
 *  twenty communities must not turn their home screen into a hundred reads. */
const MAX_COURSES_TOTAL = 40;
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

    // One read of the caller's completions, reused for every course below —
    // the alternative (deriveCourseProgress per course) re-reads this set once
    // per course.
    const completions = await ctx.db
      .query("lessonCompletions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .take(MAX_COMPLETIONS);
    const finished = new Set<string>(completions.map((c) => c.lessonId));

    const badges = await ctx.db
      .query("courseCompletions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .take(MAX_BADGES);
    const badgeCourseIds = new Set<string>(badges.map((b) => b.courseId));

    const memberships = await ctx.db
      .query("memberships")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .take(MAX_COMMUNITIES);

    const communities: OverviewCommunity[] = [];
    const courses: OverviewCourse[] = [];
    let examined = 0;

    for (const membership of memberships) {
      const tenant: Doc<"tenants"> | null = await ctx.db.get(membership.tenantId);
      // Same rule listMine holds: pending and suspended communities stay
      // invisible, so a home screen never advertises one you cannot open.
      if (tenant === null || tenant.status !== "active") continue;

      const published = await ctx.db
        .query("courses")
        .withIndex("by_tenant_status", (q) =>
          q.eq("tenantId", tenant._id).eq("status", "published")
        )
        .take(MAX_COURSES_PER_COMMUNITY);

      communities.push({
        slug: tenant.slug,
        name: tenant.name,
        role: membership.role,
        courseCount: published.length,
      });

      for (const course of published) {
        if (examined >= MAX_COURSES_TOTAL) break;
        examined += 1;
        const placements = await ctx.db
          .query("courseLessons")
          .withIndex("by_course", (q) => q.eq("courseId", course._id))
          .take(MAX_LESSONS_PER_COURSE);
        if (placements.length === 0) continue;
        const done = placements.reduce((n, p) => n + (finished.has(p.lessonId) ? 1 : 0), 0);
        courses.push({
          courseId: course._id,
          slug: course.slug,
          title: course.title,
          communitySlug: tenant.slug,
          communityName: tenant.name,
          total: placements.length,
          done,
          percent: Math.round((done / placements.length) * 100),
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
      materiDone: completions.length,
      /** True when a ceiling was hit, so the UI can say "N+" honestly. */
      truncated:
        completions.length === MAX_COMPLETIONS ||
        badges.length === MAX_BADGES ||
        examined >= MAX_COURSES_TOTAL,
    };
  },
});
