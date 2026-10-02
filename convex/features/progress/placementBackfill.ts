// Operator-only, resumable eligibility migration. Never scheduled implicitly.
// Dry-run / verifyOnly page through identical indexed rows without writing.
import { v } from "convex/values";
import { internalMutation } from "../../_generated/server";
import type { LegacyEligibility } from "./derive";

export const run = internalMutation({
  args: {
    cursor: v.union(v.string(), v.null()),
    dryRun: v.optional(v.boolean()),
    verifyOnly: v.optional(v.boolean()),
  },
  returns: v.object({
    continueCursor: v.string(), isDone: v.boolean(), scanned: v.number(),
    updated: v.number(), mismatches: v.number(),
  }),
  handler: async (ctx, args) => {
    const page = await ctx.db.query("courseLessons").withIndex("by_lesson")
      .paginate({ cursor: args.cursor, numItems: 10 });
    let updated = 0;
    let mismatches = 0;
    const eligibility: LegacyEligibility = new Map();
    for (const placement of page.page) {
      if (!eligibility.has(placement.lessonId)) {
        const lesson = await ctx.db.get(placement.lessonId);
        eligibility.set(placement.lessonId, lesson === null ? null : {
          tenantId: lesson.tenantId, published: (lesson.status ?? "published") === "published",
        });
      }
      const lesson = eligibility.get(placement.lessonId);
      const lessonPublished = lesson?.tenantId === placement.tenantId && lesson?.published === true;
      if (placement.lessonPublished === lessonPublished) continue;
      mismatches += 1;
      if (args.dryRun || args.verifyOnly) continue;
      await ctx.db.patch(placement._id, { lessonPublished });
      updated += 1;
    }
    return { continueCursor: page.continueCursor, isDone: page.isDone,
      scanned: page.page.length, updated, mismatches };
  },
});
