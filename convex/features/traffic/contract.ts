import { v, type Infer } from "convex/values";

export const trafficDays = v.union(v.literal(7), v.literal(30));
export const viewport = v.union(v.literal("mobile"), v.literal("tablet"), v.literal("desktop"), v.literal("unknown"));
export const eventFields = {
  path: v.string(), sessionId: v.string(), kind: v.union(v.literal("page"), v.literal("cta")),
  cta: v.optional(v.string()), referrerHost: v.optional(v.string()),
  utmSource: v.optional(v.string()), utmCampaign: v.optional(v.string()), viewport,
  browser: v.optional(v.string()), os: v.optional(v.string()), language: v.optional(v.string()),
  timezone: v.optional(v.string()), localHour: v.optional(v.number()), country: v.optional(v.string()), city: v.optional(v.string()),
};
export const eventValidator = v.object(eventFields);
export type TrafficEvent = Infer<typeof eventValidator>;
const count = v.object({ value: v.number(), exact: v.boolean() });
const nullableText = v.union(v.string(), v.null());
const rank = v.array(v.object({ key: v.string(), count: v.number() }));

/** No account/auth/IP data appears in this admin-only projection. */
export const trafficResult = v.object({
  period: v.object({ days: trafficDays, from: v.string(), to: v.string(), timezone: v.literal("Asia/Jakarta") }),
  collectionStart: v.union(v.number(), v.null()),
  collectionStartExact: v.literal(false),
  sources: v.array(v.object({ name: v.string(), rowsRead: v.number(), complete: v.boolean() })),
  summary: v.object({ pageViews: count, sessions: count, ctaClicks: count, directViews: count, droppedEvents: count }),
  series: v.array(v.object({ day: v.string(), pageViews: v.number(), sessions: v.number(), ctaClicks: v.number(), complete: v.boolean() })),
  perLocalHour: v.array(v.object({ hour: v.number(), count: v.number() })),
  topPaths: rank, topReferrers: rank, topSources: rank, topCampaigns: rank,
  topViewports: rank, topBrowsers: rank, topOs: rank, topLanguages: rank,
  topTimezones: rank, topCountries: rank, topCities: rank, topCtas: rank,
  recentSessions: v.array(v.object({
    id: v.string(), firstSeen: v.number(), lastSeen: v.number(), pages: v.number(),
    lastPath: v.string(), referrerHost: nullableText, viewport,
    browser: nullableText, os: nullableText, country: nullableText, city: nullableText,
  })),
  retentionDays: v.literal(30), scanLimit: v.number(),
});
export type TrafficAnalytics = Infer<typeof trafficResult>;
