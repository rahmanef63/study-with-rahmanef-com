// materi feature — tag writes. Author of the materi, or instructor+ of its
// tenant (authz helper is the first line; the denied paths are covered in
// tags.test.ts, P0).
import { v } from "convex/values";
import { mutation } from "../../_generated/server";
import { requireAuthorOrInstructor } from "./access";
import { normalizeTags, TAG_ROW_TAKE } from "./validate";

/**
 * Replace a materi's tags with `tags`, normalised (lowercase, trimmed,
 * whitespace→`-`, deduped) and capped.
 *
 * DIFFED, not delete-all-reinsert: rows that survive keep their identity and
 * their `_creationTime`, which is what `listLibrary`'s tagged branch paginates
 * on — re-saving an unchanged tag list would otherwise reshuffle the whole
 * library. It also keeps the write count proportional to the actual change.
 *
 * Rows that are duplicates, or carry a stale `tenantId`, are pruned on the way
 * past: the diff is the only place that ever sees the full row set.
 *
 * Returns the final tag list, so the caller does not re-query to render.
 */
export const setTags = mutation({
  args: { lessonId: v.id("lessons"), tags: v.array(v.string()) },
  handler: async (ctx, args): Promise<string[]> => {
    const { lesson } = await requireAuthorOrInstructor(ctx, args.lessonId); // authz FIRST (P0)
    const next = normalizeTags(args.tags);

    const existing = await ctx.db
      .query("lessonTags")
      .withIndex("by_lesson", (q) => q.eq("lessonId", lesson._id))
      .take(TAG_ROW_TAKE);

    const kept = new Set<string>();
    for (const row of existing) {
      const survives =
        next.includes(row.tag) && !kept.has(row.tag) && row.tenantId === lesson.tenantId;
      if (survives) {
        kept.add(row.tag);
        continue;
      }
      await ctx.db.delete(row._id);
    }
    for (const tag of next) {
      if (kept.has(tag)) continue;
      await ctx.db.insert("lessonTags", {
        tenantId: lesson.tenantId,
        tag,
        lessonId: lesson._id,
      });
    }
    return next;
  },
});
