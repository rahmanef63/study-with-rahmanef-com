// resources feature — read surface (R8/R9). Access rules (docs/DATA-MODEL.md):
// approved resources / open suggestions are MEMBER reads; pending items are
// visible ONLY to instructor+ and the submitter (via *Mine). The visibility
// gate is enforced HERE, in the query — a plain member can never see another
// member's pending item through any of these functions.
//
// NOT an etalase surface: none of these are anonymous (no `public*` name, no
// whitelist) — every handler runs an authz helper on its first line. Every read
// is indexed + bounded (.take), never a bare .collect().
import { v } from "convex/values";
import { query } from "../../_generated/server";
import { requireTenantRole } from "../../_shared/auth";
import { toResourceCard, toResourceReviewItem } from "./projections";
import { LIST_TAKE, MINE_TAKE } from "./validate";
import { toSuggestionCardsWithVotes } from "./votes";

/** Approved resources for the tenant board — MEMBER read. */
export const listApprovedResources = query({
  args: { tenantId: v.id("tenants") },
  handler: async (ctx, args) => {
    await requireTenantRole(ctx, args.tenantId, "member");
    const rows = await ctx.db
      .query("resources")
      .withIndex("by_tenant_status", (q) =>
        q.eq("tenantId", args.tenantId).eq("status", "approved")
      )
      .order("desc")
      .take(LIST_TAKE);
    return rows.map(toResourceCard);
  },
});

/** Pending review queue — INSTRUCTOR+ only (submitter uses listMineResources). */
export const listPendingResources = query({
  args: { tenantId: v.id("tenants") },
  handler: async (ctx, args) => {
    await requireTenantRole(ctx, args.tenantId, "instructor");
    const rows = await ctx.db
      .query("resources")
      .withIndex("by_tenant_status", (q) =>
        q.eq("tenantId", args.tenantId).eq("status", "pending")
      )
      .order("desc")
      .take(LIST_TAKE);
    return rows.map(toResourceReviewItem);
  },
});

/** The caller's OWN resources in this tenant (any status) — userId from ctx. */
export const listMineResources = query({
  args: { tenantId: v.id("tenants") },
  handler: async (ctx, args) => {
    const { userId } = await requireTenantRole(ctx, args.tenantId, "member");
    const rows = await ctx.db
      .query("resources")
      .withIndex("by_submitter", (q) => q.eq("submittedBy", userId))
      .order("desc")
      .take(MINE_TAKE);
    return rows.filter((r) => r.tenantId === args.tenantId).map(toResourceCard);
  },
});

/**
 * Open suggestions for the tenant board — MEMBER read. Each card carries the
 * derived { voteCount, myVote } (#18); the result is re-sorted voteCount desc
 * then newest, computed in-handler over the bounded LIST_TAKE window.
 */
export const listOpenSuggestions = query({
  args: { tenantId: v.id("tenants") },
  handler: async (ctx, args) => {
    const { userId } = await requireTenantRole(ctx, args.tenantId, "member");
    const rows = await ctx.db
      .query("suggestions")
      .withIndex("by_tenant_status", (q) =>
        q.eq("tenantId", args.tenantId).eq("status", "open")
      )
      .order("desc")
      .take(LIST_TAKE);
    return toSuggestionCardsWithVotes(ctx, rows, userId);
  },
});

/**
 * The caller's OWN suggestions in this tenant (any status) — userId from ctx.
 * `suggestions` has no by_submitter index (schema is fixed), so this scans the
 * tenant segment bounded via by_tenant_status then filters to the caller.
 * Cards carry { voteCount, myVote } and sort voteCount desc then newest (#18).
 */
export const listMineSuggestions = query({
  args: { tenantId: v.id("tenants") },
  handler: async (ctx, args) => {
    const { userId } = await requireTenantRole(ctx, args.tenantId, "member");
    const rows = await ctx.db
      .query("suggestions")
      .withIndex("by_tenant_status", (q) => q.eq("tenantId", args.tenantId))
      .order("desc")
      .take(MINE_TAKE);
    return toSuggestionCardsWithVotes(
      ctx,
      rows.filter((s) => s.submittedBy === userId),
      userId
    );
  },
});
