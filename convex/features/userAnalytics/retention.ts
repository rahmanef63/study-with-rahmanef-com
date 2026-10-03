import { v } from "convex/values";
import { internalMutation } from "../../_generated/server";

export const purge = internalMutation({
  args: {}, returns: v.object({ events: v.number(), budgets: v.number(), dailyBudgets: v.number() }),
  handler: async ctx => {
    const now = Date.now();
    const events = await ctx.db.query("userActivityEvents").withIndex("by_expiry", q => q.lt("expiresAt", now)).take(500);
    const budgets = await ctx.db.query("userActivityBudgets").withIndex("by_expiry", q => q.lt("expiresAt", now)).take(500);
    const dailyBudgets = await ctx.db.query("userActivityDailyBudgets").withIndex("by_expiry", q => q.lt("expiresAt", now)).take(500);
    for (const row of [...events, ...budgets, ...dailyBudgets]) await ctx.db.delete(row._id);
    return { events: events.length, budgets: budgets.length, dailyBudgets: dailyBudgets.length };
  },
});
