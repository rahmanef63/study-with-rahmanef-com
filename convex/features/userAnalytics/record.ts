import { v, ConvexError } from "convex/values";
import { mutation } from "../../_generated/server";
import { requireUser } from "../../_shared/auth";
import { activityFields } from "./contract";
import { validActivity, validActivitySecret } from "./policy";

const DAY = 86_400_000;
export const recordActivity = mutation({
  args: { event: v.object(activityFields), serverSecret: v.string() },
  returns: v.object({ accepted: v.boolean() }),
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    if (!validActivitySecret(args.serverSecret)) {
      throw new ConvexError({ code: "NOT_AUTHORIZED", message: "Akses pencatatan tidak tersedia" });
    }
    if (await ctx.db.get(userId) === null || !validActivity(args.event)) {
      throw new ConvexError({ code: "VALIDATION_FAILED", message: "Aktivitas tidak valid" });
    }
    const now = Date.now();
    const day = new Date(now).toISOString().slice(0, 10);
    const daily = await ctx.db.query("userActivityDailyBudgets").withIndex("by_day", q => q.eq("day", day)).unique();
    if ((daily?.accepted ?? 0) >= 10_000) return { accepted: false };
    const previous = await ctx.db.query("userActivityBudgets").withIndex("by_user", q => q.eq("userId", userId)).unique();
    const minuteCount = previous && now < previous.minuteResetAt ? previous.minuteCount : 0;
    const dayCount = previous && now < previous.dayResetAt ? previous.dayCount : 0;
    if (minuteCount >= 60 || dayCount >= 500) return { accepted: false };
    const counters = {
      userId, minuteCount: minuteCount + 1, dayCount: dayCount + 1,
      minuteResetAt: previous && now < previous.minuteResetAt ? previous.minuteResetAt : now + 60_000,
      dayResetAt: previous && now < previous.dayResetAt ? previous.dayResetAt : now + DAY,
      expiresAt: now + 2 * DAY,
    };
    if (previous) await ctx.db.patch(previous._id, counters);
    else await ctx.db.insert("userActivityBudgets", counters);
    if (daily) await ctx.db.patch(daily._id, { accepted: daily.accepted + 1 });
    else await ctx.db.insert("userActivityDailyBudgets", { day, accepted: 1, expiresAt: now + 32 * DAY });
    await ctx.db.insert("userActivityEvents", { userId, at: now, expiresAt: now + 30 * DAY, ...args.event });
    return { accepted: true };
  },
});
