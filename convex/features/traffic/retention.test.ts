import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { internal } from "../../_generated/api";
import { DAY_MS, PURGE_BATCH } from "./constants";
import { NOW, fixture } from "./test.helpers";

beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(NOW); });
afterEach(() => vi.useRealTimers());

test("hourly purge is bounded, resumable and preserves unexpired data without changing learning records", async () => {
  const { t, ids } = await fixture();
  await t.run(async ctx => {
    const event = { path: "/", kind: "page" as const, viewport: "unknown" as const, sessionId: "1234567890abcdef" };
    for (let index = 0; index <= PURGE_BATCH; index++) {
      await ctx.db.insert("trafficEvents", { ...event, at: NOW - 30 * DAY_MS - 1 - index });
      await ctx.db.insert("trafficBudgets", { day: `old-${index}`, accepted: 1, dropped: 0, expiresAt: NOW - 1 });
      await ctx.db.insert("trafficRateLimits", { bucket: String(index), minuteCount: 1, minuteResetAt: 0, dayCount: 1, expiresAt: NOW - 1 });
    }
    await ctx.db.insert("trafficEvents", { ...event, at: NOW - 30 * DAY_MS });
    await ctx.db.insert("trafficEvents", { ...event, at: NOW });
    await ctx.db.insert("trafficBudgets", { day: "live", accepted: 1, dropped: 0, expiresAt: NOW + 1 });
    await ctx.db.insert("trafficRateLimits", { bucket: "live", minuteCount: 1, minuteResetAt: NOW, dayCount: 1, expiresAt: NOW + 1 });
  });
  expect(await t.mutation(internal.features.traffic.retention.purge, {})).toEqual({ events: PURGE_BATCH, budgets: PURGE_BATCH, rateLimits: PURGE_BATCH });
  expect(await t.mutation(internal.features.traffic.retention.purge, {})).toEqual({ events: 1, budgets: 1, rateLimits: 1 });
  expect(await t.mutation(internal.features.traffic.retention.purge, {})).toEqual({ events: 0, budgets: 0, rateLimits: 0 });
  await t.run(async ctx => {
    expect(await ctx.db.get(ids.admin)).not.toBeNull();
    expect((await ctx.db.query("memberships").withIndex("by_user").take(10))).toHaveLength(3);
    expect((await ctx.db.query("trafficEvents").withIndex("by_at").take(10))).toHaveLength(2);
  });
});
