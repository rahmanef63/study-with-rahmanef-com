import type { QueryCtx } from "../../_generated/server";
import { query } from "../../_generated/server";
import { requirePlatformAdmin } from "../../_shared/auth";
import { platformAnalyticsResult, platformDays, type PlatformAnalytics } from "./platformContract";
import { DAY_MS, startOfPlatformDay } from "./platformActivity";
import { loadPlatformSources } from "./platformRead";
import { aggregatePlatform } from "./platformAggregate";

/** Platform administrators only; inventory spans communities deliberately.
 * Activity is current members' learning, not anonymous traffic. No PII leaves
 * this function, and every incomplete source is exposed instead of extrapolated.
 */
export const getPlatformAnalyticsHandler = async (ctx: QueryCtx, args: { days: PlatformAnalytics["period"]["days"] }) => {
    await requirePlatformAdmin(ctx);
    const today = startOfPlatformDay(Date.now());
    const fromMs = today - (args.days - 1) * DAY_MS;
    const fromDay = new Date(fromMs + 7 * 3_600_000).toISOString().slice(0, 10);
    const toDay = new Date(today + 7 * 3_600_000).toISOString().slice(0, 10);
    const sources = await loadPlatformSources(ctx, fromDay, toDay, fromMs, today + DAY_MS);
    return aggregatePlatform(sources, fromMs, args.days);
  };

export const getPlatformAnalytics = query({
  args: { days: platformDays },
  returns: platformAnalyticsResult,
  handler: getPlatformAnalyticsHandler,
});
