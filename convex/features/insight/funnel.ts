// insight feature — courseFunnel. Instructor+ read, no writes, nothing stored
// here (the only stored number is the view roll-up, written by views.ts).
// P0: v.* validators + authz helper as the FIRST handler line.
//
// THE SHAPE OF THE ANSWER. A course is a FLAT ordered list of materi
// (`courseLessons.by_course` = [courseId, order]), so the funnel is that list
// with two counts hung off each step: how many members OPENED it, and how many
// FINISHED it. Read top to bottom, the place where `viewers` falls off a cliff
// is the materi people quit on — that gap is the entire product of this query.
import { v } from "convex/values";
import type { Doc, Id } from "../../_generated/dataModel";
import { query } from "../../_generated/server";
import { requireInstructorForCourse } from "./access";
import { MAX_LESSONS_PER_COURSE } from "./constants";
import {
  EMPTY_TALLY,
  countCompletionsPerLesson,
  listTenantMemberships,
  tallyByLesson,
} from "./rollup";

/** One step of the funnel: a materi in its teaching position. */
export type FunnelStep = {
  lessonId: Id<"lessons">;
  title: string;
  /** courseLessons.order — position in THIS course, not a global rank. */
  order: number;
  /** DISTINCT members who ever opened it. The funnel's real numerator. */
  viewedCount: number;
  /** Member-days. Higher than viewedCount means people came back to re-read. */
  viewCount: number;
  /** Members who marked it complete. */
  completedCount: number;
  /** completedCount / viewedCount, rounded. 0 when nobody opened it. */
  completionRatePct: number;
  /** viewedCount relative to the FIRST step's viewedCount — the drop-off. */
  retentionPct: number;
};

export type CourseFunnel = {
  course: { _id: Id<"courses">; slug: string; title: string; status: Doc<"courses">["status"] };
  /** Every membership row of the tenant (owner + instructor + member). */
  memberCount: number;
  /** Steps whose materi row still exists, in teaching order. */
  steps: FunnelStep[];
  /** viewedCount of the first step — the denominator for `retentionPct`. */
  startedCount: number;
};

const pct = (part: number, whole: number): number =>
  whole === 0 ? 0 : Math.round((part / whole) * 100);

/**
 * Per-materi read/finish counts for one course, in teaching order.
 *
 * Drafts are visible here on purpose — only instructor+ ever reaches this
 * query and the kelola surface manages drafts too. A placement whose materi row
 * has been deleted is SKIPPED rather than rendered as a blank step.
 *
 * Both numbers come from tables that already existed or that views.ts fills:
 * nothing is stored for the funnel itself, and `retentionPct` is computed here
 * rather than by the client so every surface reads the same drop-off.
 */
export const courseFunnel = query({
  args: { courseId: v.id("courses") },
  handler: async (ctx, args): Promise<CourseFunnel> => {
    const { course } = await requireInstructorForCourse(ctx, args.courseId);

    const placements = await ctx.db
      .query("courseLessons")
      .withIndex("by_course", (q) => q.eq("courseId", course._id))
      .take(MAX_LESSONS_PER_COURSE);
    const lessons = await Promise.all(placements.map((p) => ctx.db.get(p.lessonId)));

    const memberships = await listTenantMemberships(ctx, course.tenantId);
    const completions = await countCompletionsPerLesson(
      ctx,
      memberships,
      placements.map((placement) => placement.lessonId)
    );
    const tallies = await tallyByLesson(ctx, course.tenantId);

    const rows = placements.flatMap((placement, index) => {
      const lesson = lessons[index];
      if (lesson === null) return [];
      const tally = tallies.get(lesson._id) ?? EMPTY_TALLY;
      return [
        {
          lessonId: lesson._id,
          title: lesson.title,
          order: placement.order,
          viewedCount: tally.viewers,
          viewCount: tally.views,
          completedCount: completions.get(lesson._id) ?? 0,
        },
      ];
    });

    // The first step is the denominator: "of everyone who started this course,
    // how many were still here by materi N". Using the member count instead
    // would drown the shape in people who never opened the course at all.
    const startedCount = rows.length === 0 ? 0 : rows[0].viewedCount;

    return {
      course: { _id: course._id, slug: course.slug, title: course.title, status: course.status },
      memberCount: memberships.length,
      startedCount,
      steps: rows.map((row) => ({
        ...row,
        completionRatePct: pct(row.completedCount, row.viewedCount),
        retentionPct: pct(row.viewedCount, startedCount),
      })),
    };
  },
});
