import type { QueryCtx } from "../../_generated/server";
import { query } from "../../_generated/server";
import { requirePlatformAdmin } from "../../_shared/auth";
import { trafficDays, trafficResult } from "./contract";
import { DAY_MS, SCAN_LIMIT, dayKey, dayStart } from "./constants";
import { aggregateTraffic } from "./aggregate";

export const getTrafficAnalyticsHandler = async (ctx: QueryCtx, { days }: {days:7|30}) => {
    await requirePlatformAdmin(ctx);
    const now = Date.now();
    const from = dayStart(now) - (days - 1) * DAY_MS;
    const rows = await ctx.db.query("trafficEvents").withIndex("by_at", q => q.gte("at", from).lte("at", now)).order("desc").take(SCAN_LIMIT + 1);
    const budgets = await ctx.db.query("trafficBudgets").withIndex("by_day", q => q.gte("day", dayKey(from)).lte("day", dayKey(now))).take(32);
    const earliest = await ctx.db.query("trafficEvents").withIndex("by_at", q => q.gte("at", now - 30 * DAY_MS).lte("at", now)).order("asc").first();
    const result = aggregateTraffic(rows.slice(0, SCAN_LIMIT), budgets.slice(0, 31), from, days, rows.length <= SCAN_LIMIT, budgets.length <= 31, earliest?.at ?? null);
    result.sources[0].rowsRead = rows.length;
    result.sources[1].rowsRead = budgets.length;
    return result;
  };

export const getTrafficAnalytics = query({
  args: { days: trafficDays }, returns: trafficResult,
  handler: getTrafficAnalyticsHandler,
});
