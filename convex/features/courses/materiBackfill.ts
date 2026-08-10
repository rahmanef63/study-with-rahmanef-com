// ONE-SHOT: flatten the course→module→lesson tree into standalone materi
// (DECISIONS #36/#37).
//
// Before: a lesson was OWNED by exactly one module of exactly one course.
// After: a lesson is a materi owned by the TENANT, and `courseLessons` records
// which courses teach it, in what order — so "sub agents" can sit in the Claude
// Code course and the Hermes course at once.
//
// Additive and non-destructive: it writes `courseLessons` rows and fills the new
// `slug` / `status` / `authorId` columns, and touches NOTHING on the legacy
// tree. Reads still walk `by_module` until step 2 moves them, so this can be
// run against production with the current frontend live.
//
// IDEMPOTENT via the destination, not a cursor: every insert is gated on a
// `by_course_lesson` probe and every patch on the field already being absent, so
// a re-run from scratch is a no-op. (Same reasoning as the retired boards
// backfill — a cursor alone cannot survive a restart.)
//
// Sequence: run → assert `remaining` reports 0 → move the readers (step 2) →
// drop `modules` + the legacy columns and delete this module (step 3).
import { v } from "convex/values";
import { internalMutation, internalQuery } from "../../_generated/server";
import type { Doc, Id } from "../../_generated/dataModel";
import type { MutationCtx } from "../../_generated/server";
import { legacyOrder } from "../../_shared/legacyLesson";
import { materiBackfillRef } from "./refs";

/** Courses per transaction. Each one reads its modules + lessons and writes a
 *  handful of rows, so the document budget is dominated by the largest course
 *  (MAX_LESSONS_PER_COURSE), not by the batch. */
const BATCH = 20;

/** kebab-case handle from a title. Not unique on its own — see uniqueSlug. */
function baseSlug(title: string): string {
  const slug = title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
  return slug === "" ? "materi" : slug;
}

/** First free `slug`, `slug-2`, `slug-3`… within the tenant. Bounded: a title
 *  colliding more than 50 times in one community is not a real scenario, and an
 *  unbounded loop in a mutation is worse than a suffix that looks odd. */
async function uniqueSlug(
  ctx: MutationCtx,
  tenantId: Id<"tenants">,
  title: string
): Promise<string> {
  const base = baseSlug(title);
  for (let n = 1; n <= 50; n++) {
    const candidate = n === 1 ? base : `${base}-${n}`;
    const clash = await ctx.db
      .query("lessons")
      .withIndex("by_tenant_slug", (q) => q.eq("tenantId", tenantId).eq("slug", candidate))
      .first();
    if (clash === null) return candidate;
  }
  return `${base}-${Date.now()}`;
}

export const run = internalMutation({
  args: { cursor: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const courses = await ctx.db
      .query("courses")
      .withIndex("by_creation_time", (q) =>
        args.cursor === undefined ? q : q.gt("_creationTime", args.cursor)
      )
      .take(BATCH);

    let placements = 0;
    let slugged = 0;

    for (const course of courses) {
      // Modules in order, then lessons in order inside each — the flattened
      // sequence a learner already sees, preserved exactly.
      const modules = await ctx.db
        .query("modules")
        .withIndex("by_course", (q) => q.eq("courseId", course._id))
        .take(200);
      modules.sort((a, b) => a.order - b.order);

      let position = 0;
      for (const mod of modules) {
        const lessons = await ctx.db
          .query("lessons")
          .withIndex("by_module", (q) => q.eq("moduleId", mod._id))
          .take(200);
        lessons.sort((a, b) => legacyOrder(a) - legacyOrder(b));

        for (const lesson of lessons) {
          // New columns, only when still absent.
          const patch: Partial<Doc<"lessons">> = {};
          if (lesson.slug === undefined) {
            patch.slug = await uniqueSlug(ctx, lesson.tenantId, lesson.title);
          }
          // Every legacy lesson was live: drafts were a course-level concept.
          if (lesson.status === undefined) patch.status = "published";
          if (lesson.authorId === undefined) patch.authorId = course.createdBy;
          if (Object.keys(patch).length > 0) {
            await ctx.db.patch(lesson._id, patch);
            slugged++;
          }

          const already = await ctx.db
            .query("courseLessons")
            .withIndex("by_course_lesson", (q) =>
              q.eq("courseId", course._id).eq("lessonId", lesson._id)
            )
            .first();
          if (already === null) {
            await ctx.db.insert("courseLessons", {
              tenantId: course.tenantId,
              courseId: course._id,
              lessonId: lesson._id,
              order: position,
            });
            placements++;
          }
          position++;
        }
      }
    }

    const done = courses.length < BATCH;
    if (!done) {
      await ctx.scheduler.runAfter(0, materiBackfillRef, {
        cursor: courses[courses.length - 1]._creationTime,
      });
    }
    return { courses: courses.length, placements, slugged, done };
  },
});

/** Verification gate — must report 0 for both before step 2 begins. */
export const remaining = internalQuery({
  args: {},
  handler: async (ctx) => {
    const lessons = await ctx.db.query("lessons").take(2000);
    const placements = await ctx.db.query("courseLessons").take(4000);
    const placed = new Set(placements.map((p) => p.lessonId));
    return {
      lessonsWithoutSlug: lessons.filter((l) => l.slug === undefined).length,
      lessonsWithoutPlacement: lessons.filter((l) => !placed.has(l._id)).length,
      lessons: lessons.length,
      placements: placements.length,
    };
  },
});
