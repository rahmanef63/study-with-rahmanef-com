import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { internal } from "../../_generated/api";
import { DAILY_BUDGET, DAY_MS, dayKey } from "./constants";
import { NOW, SECRET, fixture, payload, tableSizes } from "./test.helpers";
import { parseTrafficPayload } from "./policy";
import { record } from "./record";

beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(NOW); vi.stubEnv("ANALYTICS_INGEST_SECRET", SECRET); });
afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs(); });
const headers = { "content-type": "application/json", authorization: `Bearer ${SECRET}` };

test("HTTP secret authentication precedes parsing/writes and all invalid calls leave tables untouched", async () => {
  const { t } = await fixture();
  for (const authorization of [undefined, "Bearer forged", `Bearer ${"b".repeat(64)}`]) {
    const response = await t.fetch("/analytics/ingest", { method: "POST", body: "not-json", headers: authorization ? { authorization } : {} });
    expect(response.status).toBe(401);
  }
  vi.stubEnv("ANALYTICS_INGEST_SECRET", "");
  expect((await t.fetch("/analytics/ingest", { method: "POST", headers, body: JSON.stringify(payload()) })).status).toBe(401);
  vi.stubEnv("ANALYTICS_INGEST_SECRET", SECRET);
  for (const value of [payload({ email: "private@example.test" }), payload({ path: "/admin" }), payload({ kind: "cta", cta: "unknown" }), payload({ city: "Jakarta\n" }), payload({ city: null })]) {
    expect((await t.fetch("/analytics/ingest", { method: "POST", headers, body: JSON.stringify(value) })).status).toBe(400);
  }
  expect((await t.fetch("/analytics/ingest", { method: "POST", headers: { ...headers, dnt: "1" }, body: "bad" })).status).toBe(204);
  expect((await t.fetch("/analytics/ingest", { method: "POST", headers: { ...headers, "sec-gpc": "1" }, body: "bad" })).status).toBe(204);
  expect(await tableSizes(t)).toEqual({ events: 0, budgets: 0, rates: 0 });
  expect(record.isInternal).toBe(true);
});

test("accepted service event gets server timestamp; rate bucket never joins visitor event", async () => {
  const { t } = await fixture();
  expect((await t.fetch("/analytics/ingest", { method: "POST", headers, body: JSON.stringify(payload({ browser: "Chrome", country: "ID", city: "Bandung" })) })).status).toBe(204);
  const rows = await t.run(ctx => ctx.db.query("trafficEvents").withIndex("by_at").take(2));
  expect(rows).toHaveLength(1);
  expect(rows[0]).toMatchObject({ at: NOW, path: "/", browser: "Chrome", country: "ID", city: "Bandung" });
  for (const key of ["bucket", "ip", "userId", "email", "authorization"]) expect(rows[0]).not.toHaveProperty(key);
  const rates = await t.run(ctx => ctx.db.query("trafficRateLimits").withIndex("by_bucket").take(1));
  expect(rates[0].expiresAt).toBeLessThanOrEqual(NOW + 2 * DAY_MS);
});

test("transactional minute/day limits bound one source and daily global cap blocks fresh forged buckets", async () => {
  const { t } = await fixture();
  const args = parseTrafficPayload(payload())!;
  for (let index = 0; index < 60; index++) expect(await t.mutation(internal.features.traffic.record.record, args)).toEqual({ accepted: true });
  expect(await t.mutation(internal.features.traffic.record.record, args)).toEqual({ accepted: false });
  vi.setSystemTime(NOW + 60_001);
  expect(await t.mutation(internal.features.traffic.record.record, args)).toEqual({ accepted: true });
  await t.run(async ctx => {
    const rate = await ctx.db.query("trafficRateLimits").withIndex("by_bucket", q => q.eq("bucket", args.bucket)).unique();
    await ctx.db.patch(rate!._id, { dayCount: 500 });
  });
  vi.setSystemTime(NOW + 120_002);
  expect(await t.mutation(internal.features.traffic.record.record, args)).toEqual({ accepted: false });
  await t.run(async ctx => {
    const budget = await ctx.db.query("trafficBudgets").withIndex("by_day", q => q.eq("day", dayKey(NOW))).unique();
    await ctx.db.patch(budget!._id, { accepted: DAILY_BUDGET - 1 });
  });
  expect(await t.mutation(internal.features.traffic.record.record, parseTrafficPayload(payload({ bucket: "c".repeat(64) }))!)).toEqual({ accepted: true });
  expect(await t.mutation(internal.features.traffic.record.record, parseTrafficPayload(payload({ bucket: "d".repeat(64) }))!)).toEqual({ accepted: false });
  const budget = await t.run(ctx => ctx.db.query("trafficBudgets").withIndex("by_day").first());
  expect(budget).toMatchObject({ accepted: DAILY_BUDGET, dropped: 3 });
});

test("internal entry validates too and rejects unsafe shape before any data writes", async () => {
  const { t } = await fixture();
  await expect(t.mutation(internal.features.traffic.record.record, { event: { path: "/admin", sessionId: "1234567890abcdef", kind: "page", viewport: "desktop" }, bucket: "b".repeat(64) })).rejects.toThrow("VALIDATION_FAILED");
  expect(await tableSizes(t)).toEqual({ events: 0, budgets: 0, rates: 0 });
});
