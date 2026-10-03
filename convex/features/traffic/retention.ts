import { v } from "convex/values";
import { internalMutation } from "../../_generated/server";
import { DAY_MS, PURGE_BATCH, RETENTION_DAYS } from "./constants";

/** Hourly bounded sweeps; each query is indexed and the total work stays below platform limits. */
export const purge = internalMutation({
  args: {}, returns: v.object({ events: v.number(), budgets: v.number(), rateLimits: v.number() }),
  handler: async ctx => {
    const now = Date.now();
    const events = await ctx.db.query("trafficEvents").withIndex("by_at", q => q.lt("at", now - RETENTION_DAYS * DAY_MS)).take(PURGE_BATCH);
    const budgets = await ctx.db.query("trafficBudgets").withIndex("by_expiry", q => q.lt("expiresAt", now)).take(PURGE_BATCH);
    const rates = await ctx.db.query("trafficRateLimits").withIndex("by_expiry", q => q.lt("expiresAt", now)).take(PURGE_BATCH);
    for (const row of [...events, ...budgets, ...rates]) await ctx.db.delete(row._id);
    return { events: events.length, budgets: budgets.length, rateLimits: rates.length };
  },
});
