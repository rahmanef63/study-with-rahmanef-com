import { ConvexError, v } from "convex/values";
import { internalMutation } from "../../_generated/server";
import { eventFields } from "./contract";
import { parseTrafficPayload } from "./policy";
import { BUCKET_DAY_LIMIT, BUCKET_MINUTE_LIMIT, DAILY_BUDGET, DAY_MS, dayKey } from "./constants";

/** Transactional global budget closes the fresh-bucket abuse gap in the reference. */
export const record = internalMutation({
  args: { event: v.object(eventFields), bucket: v.string() },
  returns: v.object({ accepted: v.boolean() }),
  handler: async (ctx, { event, bucket }) => {
    if (!parseTrafficPayload({ ...event, bucket })) throw new ConvexError({ code: "VALIDATION_FAILED", message: "Event tidak valid" });
    const now = Date.now();
    const day = dayKey(now);
    let budget = await ctx.db.query("trafficBudgets").withIndex("by_day", q => q.eq("day", day)).unique();
    if (!budget) {
      const id = await ctx.db.insert("trafficBudgets", { day, accepted: 0, dropped: 0, expiresAt: now + 32 * DAY_MS });
      budget = await ctx.db.get(id);
    }
    if (!budget) throw new Error("Budget insert failed");
    if (budget.accepted >= DAILY_BUDGET) {
      await ctx.db.patch(budget._id, { dropped: budget.dropped + 1 });
      return { accepted: false };
    }
    const rate = await ctx.db.query("trafficRateLimits").withIndex("by_bucket", q => q.eq("bucket", bucket)).unique();
    const live = rate && rate.expiresAt > now ? rate : null;
    const minuteCount = live && live.minuteResetAt > now ? live.minuteCount : 0;
    if (live && (minuteCount >= BUCKET_MINUTE_LIMIT || live.dayCount >= BUCKET_DAY_LIMIT)) {
      await ctx.db.patch(budget._id, { dropped: budget.dropped + 1 });
      return { accepted: false };
    }
    const fields = {
      minuteCount: minuteCount + 1, minuteResetAt: live && live.minuteResetAt > now ? live.minuteResetAt : now + 60_000,
      dayCount: (live?.dayCount ?? 0) + 1, expiresAt: live?.expiresAt ?? now + 2 * DAY_MS,
    };
    if (rate) await ctx.db.patch(rate._id, fields);
    else await ctx.db.insert("trafficRateLimits", { bucket, ...fields });
    await ctx.db.patch(budget._id, { accepted: budget.accepted + 1 });
    await ctx.db.insert("trafficEvents", { ...event, at: now });
    return { accepted: true };
  },
});
