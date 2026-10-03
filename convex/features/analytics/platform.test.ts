/// <reference types="vite/client" />
import { afterEach, expect, test, vi } from "vitest";
import { api } from "../../_generated/api";
import { asUser, seedCourseWithLessons, seedQuiz, seedTenantFixture, setup } from "./test.helpers";
import { DAY_MS, platformDay, startOfPlatformDay } from "./platformActivity";
import { aggregatePlatform } from "./platformAggregate";
import { loadPlatformSources, PLATFORM_READ_BYTES, readBounded } from "./platformRead";

const NOW = Date.parse("2026-10-03T05:00:00Z");
afterEach(() => vi.restoreAllMocks());
const clock = () => vi.spyOn(Date, "now").mockReturnValue(NOW);
async function fixture() {
  clock();
  const t = setup(), fx = await seedTenantFixture(t);
  await t.run(ctx => ctx.db.insert("profiles", { userId: fx.ownerId, username: "admin", displayName: "Secret Admin Name", isPlatformAdmin: true }));
  const c = await seedCourseWithLessons(t, fx, "published", 2);
  const quizId = await seedQuiz(t, fx, c);
  return { t, fx, c, quizId, admin: t.withIdentity(asUser(fx.ownerId)) };
}

test("platform analytics authenticates first and denies all ordinary roles including owners", async () => {
  clock();
  const t = setup(), fx = await seedTenantFixture(t);
  await expect(t.query(api.features.analytics.platform.getPlatformAnalytics, { days: 7 })).rejects.toThrow(/NOT_AUTHENTICATED/);
  for (const id of [fx.memberId, fx.instructorId, fx.ownerId, fx.outsiderId]) {
    await expect(t.withIdentity(asUser(id)).query(api.features.analytics.platform.getPlatformAnalytics, { days: 7 })).rejects.toThrow(/NOT_AUTHORIZED/);
  }
});

test("accurate member-days, distinct learners, material completions, quiz averages and safe projections", async () => {
  const { t, fx, c, quizId, admin } = await fixture();
  await t.run(async ctx => {
    await ctx.db.insert("materiViews", { tenantId: fx.tenantId, lessonId: c.lessonIds[0], userId: fx.memberId, day: "2026-10-03" });
    await ctx.db.insert("materiViews", { tenantId: fx.tenantId, lessonId: c.lessonIds[0], userId: fx.memberId, day: "2026-10-02" });
    await ctx.db.insert("materiViews", { tenantId: fx.tenantId, lessonId: c.lessonIds[0], userId: fx.instructorId, day: "2026-10-03" });
    await ctx.db.insert("materiViewCounts", { tenantId: fx.tenantId, lessonId: c.lessonIds[0], views: 3, viewers: 2, lastViewedAt: NOW });
    await ctx.db.insert("lessonCompletions", { tenantId: fx.tenantId, userId: fx.memberId, lessonId: c.lessonIds[0] });
    await ctx.db.insert("courseCompletions", { tenantId: fx.tenantId, userId: fx.memberId, courseId: c.courseId });
    for (const scorePct of [100, 0]) await ctx.db.insert("quizAttempts", { tenantId: fx.tenantId, quizId, userId: fx.memberId, answers: [0], scorePct, passed: scorePct === 100 });
    await ctx.db.insert("comments", { tenantId: fx.tenantId, lessonId: c.lessonIds[0], userId: fx.memberId, bodyMd: "Private comment text" });
  });
  const result = await admin.query(api.features.analytics.platform.getPlatformAnalytics, { days: 7 });
  expect(result.summary.readMemberDays).toEqual({ value: 3, exact: true });
  expect(result.summary.activeLearners).toEqual({ value: 2, exact: true });
  expect(result.summary.lessonCompletions.value).toBe(1);
  expect(result.summary.badges.value).toBe(1);
  expect(result.summary.quizAttempts.value).toBe(2);
  expect(result.summary.quizPassRate).toBe(50);
  expect(result.quizzes[0].averageScore).toBe(50);
  expect(result.lessons.find(row => row.lessonId === c.lessonIds[0])).toMatchObject({ readers: 2, readMemberDays: 3, completions: 1, comments: 1 });
  expect(result.courses[0].eligibleLessons).toBe(2);
  expect(result.inventory.neverReadLessons).toEqual({ value: 1, exact: true });
  expect(result.series).toHaveLength(7);
  expect(result.series.at(-1)).toMatchObject({ day: "2026-10-03", activeLearners: 2, newMembers: 3 });
  const json = JSON.stringify(result);
  for (const privateText of ["Private comment text", "Secret Admin Name", fx.memberId, "correctIndex", "discordWebhookUrl", "answers", "@komunitas-test.id"]) expect(json).not.toContain(privateText);
});

test("WIB inclusive day ranges include start boundary and exclude yesterday-before-window/future", async () => {
  const { t, fx, c, admin } = await fixture();
  const spy = vi.mocked(Date.now);
  const start = startOfPlatformDay(NOW) - 6 * DAY_MS;
  for (const ms of [start - 1, start, startOfPlatformDay(NOW) + DAY_MS]) {
    spy.mockReturnValue(ms);
    await t.run(ctx => ctx.db.insert("lessonCompletions", { tenantId: fx.tenantId, userId: fx.memberId, lessonId: c.lessonIds[0] }));
  }
  await t.run(async ctx => {
    for (const day of ["2026-09-26", "2026-09-27", "2026-10-04"]) await ctx.db.insert("materiViews", { tenantId: fx.tenantId, lessonId: c.lessonIds[0], userId: fx.memberId, day });
  });
  spy.mockReturnValue(NOW);
  const week = await admin.query(api.features.analytics.platform.getPlatformAnalytics, { days: 7 });
  expect(week.period).toEqual({ days: 7, from: "2026-09-27", to: "2026-10-03", timezone: "Asia/Jakarta" });
  expect(week.summary.lessonCompletions.value).toBe(1);
  expect(week.summary.readMemberDays.value).toBe(1);
  expect(platformDay(Date.parse("2026-10-02T17:00:00Z"))).toBe("2026-10-03");
  for (const days of [30, 90] as const) {
    const result = await admin.query(api.features.analytics.platform.getPlatformAnalytics, { days });
    expect(result.series).toHaveLength(days);
    expect(result.summary.readMemberDays.value).toBe(2);
  }
});

test("deleted, missing and cross-tenant relations do not inflate events or course denominators", async () => {
  const { t, fx, c, quizId, admin } = await fixture();
  const other = await seedTenantFixture(t, "other");
  await t.run(async ctx => {
    await ctx.db.patch(c.lessonIds[1], { status: "draft" });
    await ctx.db.insert("courseLessons", { tenantId: fx.tenantId, courseId: c.courseId, lessonId: c.lessonIds[0], order: 50 });
    await ctx.db.insert("materiViews", { tenantId: other.tenantId, lessonId: c.lessonIds[0], userId: other.memberId, day: "2026-10-03" });
    await ctx.db.insert("lessonCompletions", { tenantId: fx.tenantId, userId: fx.outsiderId, lessonId: c.lessonIds[0] });
    await ctx.db.insert("quizAttempts", { tenantId: other.tenantId, quizId, userId: other.memberId, scorePct: 100, answers: [0], passed: true });
    await ctx.db.insert("comments", { tenantId: fx.tenantId, lessonId: c.lessonIds[0], userId: fx.memberId, bodyMd: "deleted", deletedAt: NOW });
    const gone = await ctx.db.insert("lessons", { tenantId: fx.tenantId, title: "Gone", contentMd: "", links: [] });
    await ctx.db.insert("courseLessons", { tenantId: fx.tenantId, courseId: c.courseId, lessonId: gone, order: 99, lessonPublished: true });
    await ctx.db.insert("lessonCompletions", { tenantId: fx.tenantId, lessonId: gone, userId: fx.memberId });
    await ctx.db.delete(gone);
  });
  const result = await admin.query(api.features.analytics.platform.getPlatformAnalytics, { days: 7 });
  expect(result.courses[0].eligibleLessons).toBe(1);
  for (const key of ["readMemberDays", "lessonCompletions", "quizAttempts", "comments"] as const) expect(result.summary[key]).toEqual({ value: 0, exact: true });
  expect(result.summary.quizPassRate).toBeNull();
  expect(result.quizzes[0].averageScore).toBeNull();
});

test("source cap exposes lower bounds, never-read uncertainty and suppresses dependent percentages", async () => {
  const { t, admin } = await fixture();
  const result = await t.run(async ctx => {
    const from = startOfPlatformDay(NOW) - 6 * DAY_MS;
    const sources = await loadPlatformSources(ctx, "2026-09-27", "2026-10-03", from, startOfPlatformDay(NOW) + DAY_MS);
    sources.attempts.complete = false;
    sources.rollups.complete = false;
    sources.placements.complete = false;
    return aggregatePlatform(sources, from, 7);
  });
  expect(result.summary.quizAttempts.exact).toBe(false);
  expect(result.summary.quizPassRate).toBeNull();
  expect(result.quizzes[0].averageScore).toBeNull();
  expect(result.courses[0].complete).toBe(false);
  expect(result.inventory.neverReadLessons).toEqual({ value: 0, exact: false });
  expect(result.series.every(row => !row.complete)).toBe(true);
  expect((await admin.query(api.features.analytics.platform.getPlatformAnalytics, { days: 7 })).sources.every(row => row.complete)).toBe(true);
});

test("indexed reader stops at row/byte cap and marks remaining sources incomplete", async () => {
  const { t, c, admin } = await fixture();
  const lesson = await t.run(ctx => ctx.db.get(c.lessonIds[0]));
  if (!lesson) throw new Error("Missing test lesson");
  async function* rows() { yield lesson!; yield lesson!; yield lesson!; }
  const bounded = await readBounded(rows(), { bytes: 0, rows: 0 }, 2);
  expect(bounded).toMatchObject({ complete: false, rowsRead: 3 });
  expect(bounded.rows).toHaveLength(2);
  const budget = { bytes: PLATFORM_READ_BYTES - 1, rows: 0 };
  expect(await readBounded(rows(), budget)).toMatchObject({ complete: false, rowsRead: 1, rows: [] });
  expect(await readBounded(rows(), budget)).toMatchObject({ complete: false, rowsRead: 0, rows: [] });
  await t.run(ctx => ctx.db.patch(c.lessonIds[0], { contentMd: "x".repeat(1_048_000) }));
  const result = await admin.query(api.features.analytics.platform.getPlatformAnalytics, { days: 7 });
  expect(result.sources.some(source => !source.complete)).toBe(true);
  expect(result.summary.activeLearners.exact).toBe(false);
  expect(result.summary.quizPassRate).toBeNull();
});

test("platform distinct active learners deduplicate across communities; joins are memberships, not accounts", async () => {
  const { t, fx, c, admin } = await fixture();
  const other = await seedTenantFixture(t, "second");
  const secondCourse = await seedCourseWithLessons(t, other, "published", 1);
  await t.run(async ctx => {
    await ctx.db.insert("memberships", { tenantId: other.tenantId, userId: fx.memberId, role: "member" });
    for (const [tenantId, lessonId] of [[fx.tenantId, c.lessonIds[0]], [other.tenantId, secondCourse.lessonIds[0]]] as const) {
      await ctx.db.insert("materiViews", { tenantId, lessonId, userId: fx.memberId, day: "2026-10-03" });
    }
  });
  const result = await admin.query(api.features.analytics.platform.getPlatformAnalytics, { days: 7 });
  expect(result.summary.activeLearners).toEqual({ value: 1, exact: true });
  expect(result.summary.readMemberDays).toEqual({ value: 2, exact: true });
  expect(result.summary.newMembers).toEqual({ value: 7, exact: true });
  expect(result.summary.users.value).toBe(8);
  expect(result.communities.map(row => row.activeLearners)).toEqual([1, 1]);
  expect(result.series.at(-1)?.activeLearners).toBe(1);
});

test("inventory source caps are disclosed without extrapolating missing communities", async () => {
  const { t, fx, admin } = await fixture();
  await t.run(async ctx => {
    for (let i = 0; i < 129; i++) await ctx.db.insert("tenants", { slug: `cap-${i}`, name: `Cap ${i}`, description: "", ownerId: fx.ownerId, status: "pending" });
  });
  const result = await admin.query(api.features.analytics.platform.getPlatformAnalytics, { days: 7 });
  expect(result.summary.communities).toEqual({ value: 128, exact: false });
  expect(result.sources.find(source => source.name === "tenants")).toMatchObject({ rowsRead: 129, complete: false });
  expect(result.communities).toHaveLength(128);
  expect(result.summary.memberships.exact).toBe(false);
  expect(result.summary.quizPassRate).toBeNull();
});
