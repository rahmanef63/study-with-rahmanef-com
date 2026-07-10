// comments feature — read surface (#16). MEMBER read of the lesson's tenant
// (draft-course lessons stay instructor+ via requireMemberForLesson). NOT an
// etalase surface: no anonymous access, authz helper runs before any domain
// read. Every read is indexed + bounded (.take), never a bare .collect().
//
// Reading the shared `profiles` table for the author display is sanctioned
// (table access ≠ code import; precedent: profiles/progress — AGENTS.md §4).
import { v } from "convex/values";
import type { Doc, Id } from "../../_generated/dataModel";
import { query, type QueryCtx } from "../../_generated/server";
import { requireMemberForLesson } from "./access";
import {
  toCommentItem,
  type CommentAuthor,
  type LessonCommentsResult,
} from "./projections";
import { LIST_TAKE } from "./validate";

/** One indexed profile lookup per DISTINCT live author (bounded by LIST_TAKE). */
async function joinAuthors(
  ctx: QueryCtx,
  rows: Doc<"comments">[]
): Promise<Map<Id<"users">, CommentAuthor>> {
  const authorIds = new Set(
    rows.filter((c) => c.deletedAt === undefined).map((c) => c.userId)
  );
  const authors = new Map<Id<"users">, CommentAuthor>();
  for (const userId of authorIds) {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    authors.set(
      userId,
      profile ? { displayName: profile.displayName, username: profile.username } : null
    );
  }
  return authors;
}

/**
 * Flat comment list for a lesson, newest-first (client nests replies under
 * their roots via buildThread — slices/comments/lib/thread.ts). Soft-deleted
 * rows are projected as placeholders; bodyMd never leaks after deletion
 * (asserted in queries.test.ts). `canModerate` = viewer is instructor+ (UX
 * hint; softDelete re-checks server-side).
 */
export const listByLesson = query({
  args: { lessonId: v.id("lessons") },
  handler: async (ctx, args): Promise<LessonCommentsResult> => {
    const { userId, membership } = await requireMemberForLesson(ctx, args.lessonId);
    const rows = await ctx.db
      .query("comments")
      .withIndex("by_lesson", (q) => q.eq("lessonId", args.lessonId))
      .order("desc") // newest first — the take-bound trims OLD comments only
      .take(LIST_TAKE);
    const authors = await joinAuthors(ctx, rows);
    return {
      canModerate: membership.role !== "member",
      items: rows.map((c) => toCommentItem(c, authors.get(c.userId) ?? null, userId)),
    };
  },
});
