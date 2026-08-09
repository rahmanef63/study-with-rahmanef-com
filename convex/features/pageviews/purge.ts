// One-shot purge for the retired cookieless-analytics tables.
//
// The beacon, the ingest mutation and the traffic UI are gone, but the rows are
// still in the deployment and `defineSchema` validates every declared table, so
// the table definitions in tables.ts must stay until the rows are at zero.
// Sequence: run this to completion → assert both counts are 0 → THEN drop
// `...pageviewTables` from convex/schema.ts and delete this file with tables.ts.
//
//   npx convex run --prod features/pageviews/purge:purgeAll
//   npx convex run --prod features/pageviews/purge:remaining
//
// internalMutation = not callable from any client (AGENTS.md §6).
import { internal } from "../../_generated/api";
import { internalMutation, internalQuery } from "../../_generated/server";
import { v } from "convex/values";

// Convex mutations are transactions with a bounded document budget, so the
// delete walks in batches and re-schedules itself instead of collecting the
// table. 500 is comfortably under the limit for two tiny tables.
const BATCH = 500;

export const purgeAll = internalMutation({
  args: {},
  handler: async (ctx) => {
    const views = await ctx.db.query("pageviews").take(BATCH);
    for (const row of views) await ctx.db.delete(row._id);

    // Only start on the (much smaller) rate-limit table once the big one is
    // drained, so a single pass never exceeds the budget.
    let limits: { _id: import("../../_generated/dataModel").Id<"pageviewRateLimits"> }[] = [];
    if (views.length < BATCH) {
      limits = await ctx.db.query("pageviewRateLimits").take(BATCH);
      for (const row of limits) await ctx.db.delete(row._id);
    }

    const done = views.length < BATCH && limits.length < BATCH;
    if (!done) await ctx.scheduler.runAfter(0, internal.features.pageviews.purge.purgeAll, {});
    return { deletedViews: views.length, deletedLimits: limits.length, done };
  },
});

/** Verification gate — must return { pageviews: 0, rateLimits: 0 } before the
 *  tables may be dropped from the schema. Bounded reads, not a full count. */
export const remaining = internalQuery({
  args: { probe: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const n = args.probe ?? 1000;
    const views = await ctx.db.query("pageviews").take(n);
    const limits = await ctx.db.query("pageviewRateLimits").take(n);
    return {
      pageviews: views.length,
      rateLimits: limits.length,
      atLeast: views.length === n || limits.length === n,
    };
  },
});
