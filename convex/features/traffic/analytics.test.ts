import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { api } from "../../_generated/api";
import { aggregateTraffic } from "./aggregate";
import { DAY_MS, SCAN_LIMIT, dayKey, dayStart } from "./constants";
import { NOW, fixture, identity } from "./test.helpers";

beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(NOW); });
afterEach(() => vi.useRealTimers());

test("anonymous, plain member, instructor and tenant owner cannot read platform traffic", async () => {
  const { t, ids } = await fixture();
  await expect(t.query(api.features.traffic.queries.getTrafficAnalytics, { days: 7 })).rejects.toThrow("NOT_AUTHENTICATED");
  for (const userId of [ids.member, ids.instructor, ids.owner]) {
    await expect(t.withIdentity(identity(userId)).query(api.features.traffic.queries.getTrafficAnalytics, { days: 7 })).rejects.toThrow("NOT_AUTHORIZED");
  }
  await expect(t.withIdentity(identity(ids.admin)).query(api.features.traffic.queries.getTrafficAnalytics, { days: 90 as 7 })).rejects.toThrow();
});

test("empty period is zero-filled, historical collection start is unknown and dimensions stay empty", async () => {
  const { admin } = await fixture();
  const data = await admin.query(api.features.traffic.queries.getTrafficAnalytics, { days: 7 });
  expect(data.period).toEqual({ days: 7, from: "2026-09-27", to: "2026-10-03", timezone: "Asia/Jakarta" });
  expect(data.collectionStart).toBeNull();
  expect(data.collectionStartExact).toBe(false);
  expect(data.summary.pageViews).toEqual({ value: 0, exact: true });
  expect(data.series).toHaveLength(7);
  expect(data.series.every(row => row.pageViews === 0 && row.sessions === 0 && row.complete)).toBe(true);
  expect(data.topCountries).toEqual([]);
  expect(data.topCities).toEqual([]);
  expect(data.recentSessions).toEqual([]);
});

test("WIB day, page vs CTA, ephemeral sessions and unknown buckets remain separate without identities", async () => {
  const { t, admin } = await fixture();
  await t.run(async ctx => {
    const base = { path: "/", sessionId: "1111111111111111", kind: "page" as const, viewport: "desktop" as const };
    await ctx.db.insert("trafficEvents", { ...base, at: Date.parse("2026-10-02T16:59:59Z"), browser: "Chrome", country: "ID", localHour: 23, referrerHost: "example.test", utmSource: "newsletter" });
    await ctx.db.insert("trafficEvents", { ...base, path: "/komunitas", at: Date.parse("2026-10-02T17:00:00Z") });
    await ctx.db.insert("trafficEvents", { ...base, sessionId: "2222222222222222", at: NOW - 1000 });
    await ctx.db.insert("trafficEvents", { ...base, kind: "cta", cta: "join", at: NOW });
    await ctx.db.insert("trafficEvents", { ...base, at: NOW - 31 * DAY_MS });
    await ctx.db.insert("trafficEvents", { ...base, at: NOW + 1000 });
    await ctx.db.insert("trafficBudgets", { day: dayKey(NOW), accepted: 4, dropped: 0, expiresAt: NOW + DAY_MS });
  });
  const data = await admin.query(api.features.traffic.queries.getTrafficAnalytics, { days: 7 });
  expect(data.summary).toEqual({
    pageViews: { value: 3, exact: true }, sessions: { value: 2, exact: true },
    ctaClicks: { value: 1, exact: true }, directViews: { value: 2, exact: true }, droppedEvents: { value: 0, exact: true },
  });
  expect(data.series.at(-2)).toMatchObject({ day: "2026-10-02", pageViews: 1, sessions: 1 });
  expect(data.series.at(-1)).toMatchObject({ day: "2026-10-03", pageViews: 2, sessions: 2, ctaClicks: 1 });
  expect(data.topCountries).toEqual([{ key: "unknown", count: 2 }, { key: "ID", count: 1 }]);
  expect(data.topCities).toEqual([{ key: "unknown", count: 3 }]);
  expect(data.topCtas).toEqual([{ key: "join", count: 1 }]);
  expect(data.perLocalHour[23]).toEqual({ hour: 23, count: 1 });
  expect(data.recentSessions[0]).toMatchObject({ id: "11111111", pages: 2, lastSeen: NOW, lastPath: "/" });
  expect(data.recentSessions.every(row => row.city === null)).toBe(true);
  expect(JSON.stringify(data)).not.toContain("1111111111111111");
  expect(data.collectionStart).toBe(Date.parse("2026-10-02T16:59:59Z"));
  for (const row of data.recentSessions) for (const key of ["email", "userId", "bucket", "sessionId", "ip"]) expect(row).not.toHaveProperty(key);
  expect((await admin.query(api.features.traffic.queries.getTrafficAnalytics, { days: 30 })).series).toHaveLength(30);
});

test("global drops and truncated scans explicitly mark lower bounds", async () => {
  const { t, admin } = await fixture();
  await t.run(async ctx => {
    await ctx.db.insert("trafficEvents", { at: NOW, path: "/", kind: "page", viewport: "unknown", sessionId: "1234567890abcdef" });
    await ctx.db.insert("trafficBudgets", { day: dayKey(NOW), accepted: 1, dropped: 7, expiresAt: NOW + DAY_MS });
  });
  const data = await admin.query(api.features.traffic.queries.getTrafficAnalytics, { days: 7 });
  expect(data.summary.pageViews).toEqual({ value: 1, exact: false });
  expect(data.summary.droppedEvents).toEqual({ value: 7, exact: true });
  expect(data.series.at(-1)?.complete).toBe(false);
  const rows = await t.run(ctx => ctx.db.query("trafficEvents").withIndex("by_at").take(1));
  const capped = aggregateTraffic(rows, [], dayStart(NOW), 7, false, true, NOW);
  expect(capped.summary.sessions.exact).toBe(false);
  expect(capped.sources[0].complete).toBe(false);
  expect(capped.topCities).toEqual([{ key: "unknown", count: 1 }]);
  expect(capped.series.every(row => !row.complete)).toBe(true);
});

test("city rankings combine country, preserve old unknown rows and expose only coarse session location", async () => {
  const { t, admin } = await fixture();
  await t.run(async ctx => {
    const base = { path: "/", kind: "page" as const, viewport: "desktop" as const };
    const locations = [{ city: "Bandung", country: "ID" }, { city: "Bandung", country: "ID" }, { city: "Bandung", country: "US" }, { city: "東京" }, { country: "ID" }, {}];
    for (const [index, location] of locations.entries()) await ctx.db.insert("trafficEvents", { ...base, ...location, sessionId: index.toString(16).padStart(16, "0"), at: NOW - index });
    await ctx.db.insert("trafficEvents", { ...base, sessionId: "ffffffffffffffff", kind: "cta", cta: "join", city: "Not a page", country: "ID", at: NOW });
  });
  const data = await admin.query(api.features.traffic.queries.getTrafficAnalytics, { days: 7 });
  expect(data.topCities).toEqual(expect.arrayContaining([{ key: "Bandung, ID", count: 2 }, { key: "Bandung, US", count: 1 }, { key: "東京", count: 1 }, { key: "unknown", count: 2 }]));
  expect(data.topCities).toHaveLength(4);
  expect(data.recentSessions.find(row => row.id === "00000000")).toMatchObject({ city: "Bandung", country: "ID" });
  expect(data.recentSessions.find(row => row.id === "00000005")).toMatchObject({ city: null, country: null });
  expect(data.summary.pageViews).toEqual({ value: 6, exact: true });
});

test("query reads cap+1, discloses truncation and returns most-recent bounded slice", async () => {
  const { t, admin } = await fixture();
  await t.run(async ctx => {
    for (let index = 0; index <= SCAN_LIMIT; index++) {
      await ctx.db.insert("trafficEvents", { at: NOW - index, path: "/", kind: "page", viewport: "unknown", sessionId: "1234567890abcdef" });
    }
  });
  const data = await admin.query(api.features.traffic.queries.getTrafficAnalytics, { days: 7 });
  expect(data.summary.pageViews).toEqual({ value: SCAN_LIMIT, exact: false });
  expect(data.sources[0]).toEqual({ name: "trafficEvents", rowsRead: SCAN_LIMIT + 1, complete: false });
  expect(data.recentSessions[0].lastSeen).toBe(NOW);
});
