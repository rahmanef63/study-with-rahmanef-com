import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { api, internal } from "../../_generated/api";
import { allowedUserActivityPath, validActivityTarget, validActivity } from "./policy";
import { fixture, identity, NOW, SECRET } from "./test.helpers";

const event = { kind: "page" as const, path: "/home", viewport: "desktop" as const };
beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(NOW); vi.stubEnv("ANALYTICS_INGEST_SECRET", SECRET); });
afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs(); });

test("recording requires actual caller identity plus server authority before accepting coarse location", async () => {
  const { t, member, ids } = await fixture();
  await expect(t.mutation(api.features.userAnalytics.record.recordActivity, { event, serverSecret: SECRET })).rejects.toThrow("NOT_AUTHENTICATED");
  await expect(member.mutation(api.features.userAnalytics.record.recordActivity, { event: { ...event, country: "ID", city: "Bandung" }, serverSecret: "b".repeat(64) })).rejects.toThrow("NOT_AUTHORIZED");
  expect(await member.mutation(api.features.userAnalytics.record.recordActivity, { event, serverSecret: SECRET })).toEqual({ accepted: true });
  const rows = await t.run(ctx => ctx.db.query("userActivityEvents").withIndex("by_user_at", q => q.eq("userId", ids.member)).take(2));
  expect(rows[0]).toMatchObject({ userId: ids.member, path: "/home", at: NOW, expiresAt: NOW + 30 * 86400000 });
  expect(rows[0]).not.toHaveProperty("serverSecret");
  expect(rows[0]).not.toHaveProperty("country");
  await t.run(ctx => ctx.db.delete(ids.outsider));
  await expect(t.withIdentity(identity(ids.outsider)).mutation(api.features.userAnalytics.record.recordActivity, { event, serverSecret: SECRET })).rejects.toThrow("VALIDATION_FAILED");
});

test("internal page and click allowlists cover actual reader/quiz routes and reject private identifiers, raw queries and credentials", () => {
  for (const path of ["/home", "/k/fixture", "/k/fixture/materi/dasar-ai", "/k/fixture/kelas/dasar/jdabc123", "/k/fixture/kelas/dasar/kuis/jkabc123", "/k/fixture/post/jpabc123", "/k/fixture/kalender"]) expect(allowedUserActivityPath(path)).toBe(true);
  for (const path of ["/admin", "/pengaturan", "/u/member", "/k/fixture/kelola", "/home?token=secret", "/k/fixture/materi/%2Fprivate"]) expect(allowedUserActivityPath(path)).toBe(false);
  for (const target of ["https://example.test/resource", "/k/fixture/materi/dasar-ai"]) expect(validActivityTarget(target)).toBe(true);
  for (const target of ["javascript:alert(1)", "https://user:secret@example.test/path", "https://example.test/?token=x", "https://example.test/#secret", "http://example.test", "https://127.0.0.1/path", "https://example.test/oauth/callback", "https://study-with.rahmanef.com/admin", "https://study-with.rahmanef.com/pengaturan"]) expect(validActivityTarget(target)).toBe(false);
  expect(validActivity({ ...event, kind: "click" })).toBe(false);
  expect(validActivity({ ...event, city: "<script>" })).toBe(false);
});

test("invalid activity leaves no budgets or events and no client-controlled day is accepted", async () => {
  const { t, member } = await fixture();
  for (const changes of [{ path: "/admin" }, { kind: "click" as const }, { target: "/home" }, { country: "XX" }, { referrerHost: "https://google.com/query?secret=x" }, { utmCampaign: "unsafe?value" }]) {
    await expect(member.mutation(api.features.userAnalytics.record.recordActivity, { event: { ...event, ...changes }, serverSecret: SECRET })).rejects.toThrow("VALIDATION_FAILED");
  }
  expect(await t.run(ctx => ctx.db.query("userActivityEvents").withIndex("by_at").take(1))).toEqual([]);
  expect(await t.run(ctx => ctx.db.query("userActivityBudgets").withIndex("by_user").take(1))).toEqual([]);
});

test("per-account minute/day budgets reject overflows, reset only server-side and isolate other users", async () => {
  const { t, member, ids } = await fixture();
  const budgetId = await t.run(ctx => ctx.db.insert("userActivityBudgets", { userId: ids.member, minuteResetAt: NOW + 60000, minuteCount: 60, dayResetAt: NOW + 86400000, dayCount: 60, expiresAt: NOW + 2 * 86400000 }));
  expect(await member.mutation(api.features.userAnalytics.record.recordActivity, { event, serverSecret: SECRET })).toEqual({ accepted: false });
  vi.setSystemTime(NOW + 60001);
  expect(await member.mutation(api.features.userAnalytics.record.recordActivity, { event, serverSecret: SECRET })).toEqual({ accepted: true });
  await t.run(ctx => ctx.db.patch(budgetId, { minuteCount: 0, dayCount: 500 }));
  expect(await member.mutation(api.features.userAnalytics.record.recordActivity, { event, serverSecret: SECRET })).toEqual({ accepted: false });
  expect(await t.withIdentity(identity(ids.outsider)).mutation(api.features.userAnalytics.record.recordActivity, { event, serverSecret: SECRET })).toEqual({ accepted: true });
  vi.setSystemTime(NOW + 86400001);
  expect(await member.mutation(api.features.userAnalytics.record.recordActivity, { event, serverSecret: SECRET })).toEqual({ accepted: true });
});

test("hourly bounded retention deletes expired account activity and budgets without touching retained or anonymous rows", async () => {
  const { t, ids } = await fixture();
  await t.run(async ctx => {
    await ctx.db.insert("userActivityEvents", { userId: ids.member, at: NOW - 31 * 86400000, expiresAt: NOW - 1, ...event });
    await ctx.db.insert("userActivityEvents", { userId: ids.member, at: NOW, expiresAt: NOW + 86400000, ...event });
    await ctx.db.insert("userActivityBudgets", { userId: ids.member, minuteResetAt: NOW - 1, minuteCount: 1, dayResetAt: NOW - 1, dayCount: 1, expiresAt: NOW - 1 });
    await ctx.db.insert("userActivityDailyBudgets", { day: "2026-09-01", accepted: 1, expiresAt: NOW - 1 });
    await ctx.db.insert("trafficEvents", { at: NOW, kind: "page", path: "/", sessionId: "1234567890abcdef", viewport: "desktop" });
  });
  expect(await t.mutation(internal.features.userAnalytics.retention.purge, {})).toEqual({ events: 1, budgets: 1, dailyBudgets: 1 });
  expect(await t.run(ctx => ctx.db.query("userActivityEvents").withIndex("by_at").take(10))).toHaveLength(1);
  expect(await t.run(ctx => ctx.db.query("trafficEvents").withIndex("by_at").take(10))).toHaveLength(1);
});

test("durable global daily budget survives server instances and caps growth below hourly retention throughput", async () => {
  const { t, member } = await fixture();
  const dailyId = await t.run(ctx => ctx.db.insert("userActivityDailyBudgets", { day: "2026-10-03", accepted: 9999, expiresAt: NOW + 32 * 86400000 }));
  expect(await member.mutation(api.features.userAnalytics.record.recordActivity, { event, serverSecret: SECRET })).toEqual({ accepted: true });
  expect(await member.mutation(api.features.userAnalytics.record.recordActivity, { event, serverSecret: SECRET })).toEqual({ accepted: false });
  expect(await t.run(ctx => ctx.db.get(dailyId))).toMatchObject({ accepted: 10000 });
  vi.setSystemTime(NOW + 86400000);
  expect(await member.mutation(api.features.userAnalytics.record.recordActivity, { event, serverSecret: SECRET })).toEqual({ accepted: true });
});
