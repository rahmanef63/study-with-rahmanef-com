// Cookieless visitor analytics — PLATFORM-ADMIN traffic dashboard read. One
// query powers the Traffic view: totals + unique sessions + top
// paths/referrers/countries/cities + per-day volume. P0: requirePlatformAdmin
// is the FIRST handler line (route/layout guards are UX only). Bounded read via
// by_at — never a bare .collect().
import { v } from "convex/values";
import { query } from "../../_generated/server";
import { requirePlatformAdmin } from "../../_shared/auth";
import { DEFAULT_WINDOW_MS, SUMMARY_HARD_CAP } from "./constants";

export type TrafficBucket = { key: string; count: number };
export type TrafficSummary = {
  total: number;
  capped: boolean;
  uniqueSessions: number;
  topPaths: TrafficBucket[];
  topReferrers: TrafficBucket[];
  topCountries: TrafficBucket[];
  topCities: TrafficBucket[];
  perDay: { day: string; count: number }[];
};

const dayKey = (t: number) => new Date(t).toISOString().slice(0, 10);
const topN = (m: Map<string, number>, n: number): TrafficBucket[] =>
  [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([key, count]) => ({ key, count }));

export const summary = query({
  args: { sinceMs: v.optional(v.number()) },
  handler: async (ctx, { sinceMs }): Promise<TrafficSummary> => {
    await requirePlatformAdmin(ctx); // authz FIRST
    const cutoff = Date.now() - (sinceMs ?? DEFAULT_WINDOW_MS);
    const rows = await ctx.db
      .query("pageviews")
      .withIndex("by_at", (q) => q.gt("at", cutoff))
      .order("desc")
      .take(SUMMARY_HARD_CAP);

    const byPath = new Map<string, number>();
    const byReferrer = new Map<string, number>();
    const byCountry = new Map<string, number>();
    const byCity = new Map<string, number>();
    const byDay = new Map<string, number>();
    const sessions = new Set<string>();
    for (const r of rows) {
      byPath.set(r.path, (byPath.get(r.path) ?? 0) + 1);
      if (r.referrerHost) byReferrer.set(r.referrerHost, (byReferrer.get(r.referrerHost) ?? 0) + 1);
      if (r.country) byCountry.set(r.country, (byCountry.get(r.country) ?? 0) + 1);
      if (r.city) {
        const k = r.country ? `${r.city}, ${r.country}` : r.city;
        byCity.set(k, (byCity.get(k) ?? 0) + 1);
      }
      byDay.set(dayKey(r.at), (byDay.get(dayKey(r.at)) ?? 0) + 1);
      if (r.sessionId) sessions.add(r.sessionId);
    }

    return {
      total: rows.length,
      capped: rows.length === SUMMARY_HARD_CAP,
      uniqueSessions: sessions.size,
      topPaths: topN(byPath, 20),
      topReferrers: topN(byReferrer, 10),
      topCountries: topN(byCountry, 10),
      topCities: topN(byCity, 10),
      perDay: [...byDay.entries()].sort().map(([day, count]) => ({ day, count })),
    };
  },
});
