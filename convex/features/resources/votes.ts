// resources feature — suggestion votes (#18, R9 fase-2). One vote per user per
// suggestion via the by_suggestion_user unique path; the count is DERIVED at
// read time via by_suggestion — never stored (docs/DATA-MODEL.md fase-2 note).
// P0: v.* validators; auth BEFORE the suggestion read (no existence oracle);
// tenantId always comes from the suggestion row, never from client args.
import { v } from "convex/values";
import type { Doc, Id } from "../../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../../_generated/server";
import { mutation } from "../../_generated/server";
import { requireMemberForSuggestion } from "./access";
import { toSuggestionCard, type SuggestionCardWithVotes } from "./projections";

type Ctx = QueryCtx | MutationCtx;

// Bounds the by_suggestion count scan (no bare .collect()). A community-sized
// tenant stays far below this by design; past the cap a displayed count simply
// saturates — acceptable for a popularity signal, and the toggle itself never
// depends on the count. // TODO(rr): bounded table — derived count per DATA-MODEL fase-2.
export const VOTE_COUNT_TAKE = 500;

/** The caller's vote row for a suggestion, or null (by_suggestion_user is unique per pair). */
export async function getVote(
  ctx: Ctx,
  suggestionId: Id<"suggestions">,
  userId: Id<"users">
): Promise<Doc<"suggestionVotes"> | null> {
  return ctx.db
    .query("suggestionVotes")
    .withIndex("by_suggestion_user", (q) =>
      q.eq("suggestionId", suggestionId).eq("userId", userId)
    )
    .unique();
}

/** Derived vote count for one suggestion — bounded index scan, never stored. */
export async function countVotes(
  ctx: Ctx,
  suggestionId: Id<"suggestions">
): Promise<number> {
  const rows = await ctx.db
    .query("suggestionVotes")
    .withIndex("by_suggestion", (q) => q.eq("suggestionId", suggestionId))
    .take(VOTE_COUNT_TAKE);
  return rows.length;
}

/**
 * Enrich suggestion rows with { voteCount, myVote } and sort by voteCount desc,
 * then newest first — computed in-handler over an ALREADY-BOUNDED list (callers
 * pass ≤ LIST_TAKE/MINE_TAKE rows; every per-row lookup is indexed + bounded).
 */
export async function toSuggestionCardsWithVotes(
  ctx: Ctx,
  rows: Doc<"suggestions">[],
  userId: Id<"users">
): Promise<SuggestionCardWithVotes[]> {
  const cards = await Promise.all(
    rows.map(async (s) => ({
      ...toSuggestionCard(s),
      voteCount: await countVotes(ctx, s._id),
      myVote: (await getVote(ctx, s._id, userId)) !== null,
    }))
  );
  return cards.sort(
    (a, b) => b.voteCount - a.voteCount || b.createdAt - a.createdAt
  );
}

/**
 * Member toggles their vote on a suggestion — idempotent: an existing vote is
 * removed, a missing one is inserted. The read-modify-write runs on the unique
 * by_suggestion_user path inside one serializable mutation, so a double vote is
 * impossible. Authz: requireUser BEFORE the suggestion read, then member on the
 * suggestion's OWN tenant (cross-tenant callers get NOT_AUTHORIZED).
 */
export const toggleVote = mutation({
  args: { suggestionId: v.id("suggestions") },
  handler: async (ctx, args) => {
    const { userId, suggestion } = await requireMemberForSuggestion(ctx, args.suggestionId);
    const existing = await getVote(ctx, args.suggestionId, userId);
    if (existing !== null) {
      await ctx.db.delete(existing._id);
      return { voted: false };
    }
    await ctx.db.insert("suggestionVotes", {
      tenantId: suggestion.tenantId, // from the suggestion row, never from args
      suggestionId: args.suggestionId,
      userId,
    });
    return { voted: true };
  },
});
