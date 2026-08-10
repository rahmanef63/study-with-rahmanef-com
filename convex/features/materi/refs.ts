// materi feature — the materi→materi reference graph.
// INTERNAL ONLY: `lessonRefs` is DERIVED from the content, so the write path is
// "content was saved, here is what it links to", never a user action. Being an
// internalMutation is the authorization: it is unreachable from a client, and
// its caller (the materi save path in features/courses) has already run its own
// instructor-level check. Args are still v.* validated (P0 applies to every
// Convex function, public or not).
import { v } from "convex/values";
import { internalMutation } from "../../_generated/server";
import type { Id } from "../../_generated/dataModel";
import { fail } from "./errors";
import { MAX_REFS_PER_LESSON, REF_ROW_TAKE } from "./validate";

/**
 * Reconcile the outgoing references of one materi to exactly `toLessonIds`.
 *
 * Sanitised before the diff: self-references dropped, duplicates dropped,
 * targets that do not exist or live in ANOTHER TENANT dropped — a reference row
 * is a cross-tenant read primitive, so `backlinksFor` must never be handed one.
 * The list is then capped at MAX_REFS_PER_LESSON.
 *
 * Diffed, not delete-all-reinsert: a re-save of unchanged content performs zero
 * writes, which matters because this runs on every save.
 */
export const syncRefs = internalMutation({
  args: { lessonId: v.id("lessons"), toLessonIds: v.array(v.id("lessons")) },
  handler: async (ctx, args) => {
    const from = await ctx.db.get(args.lessonId);
    if (from === null) fail("NOT_FOUND", "Materi tidak ditemukan");

    const wanted: Array<Id<"lessons">> = [];
    for (const toLessonId of args.toLessonIds) {
      if (wanted.length >= MAX_REFS_PER_LESSON) break;
      if (toLessonId === args.lessonId) continue; // a page does not link to itself
      if (wanted.includes(toLessonId)) continue;
      const target = await ctx.db.get(toLessonId);
      if (target === null || target.tenantId !== from.tenantId) continue;
      wanted.push(toLessonId);
    }

    const existing = await ctx.db
      .query("lessonRefs")
      .withIndex("by_from", (q) => q.eq("fromLessonId", args.lessonId))
      .take(REF_ROW_TAKE);

    const kept = new Set<string>();
    for (const row of existing) {
      const survives =
        wanted.includes(row.toLessonId) &&
        !kept.has(row.toLessonId) &&
        row.tenantId === from.tenantId;
      if (survives) {
        kept.add(row.toLessonId);
        continue;
      }
      await ctx.db.delete(row._id);
    }

    let added = 0;
    for (const toLessonId of wanted) {
      if (kept.has(toLessonId)) continue;
      await ctx.db.insert("lessonRefs", {
        tenantId: from.tenantId,
        fromLessonId: args.lessonId,
        toLessonId,
      });
      added++;
    }
    return { refs: wanted.length, added, removed: existing.length - kept.size };
  },
});
