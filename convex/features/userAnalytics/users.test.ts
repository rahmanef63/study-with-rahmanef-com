import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { api } from "../../_generated/api";
import { fixture, identity, NOW } from "./test.helpers";

beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(NOW); });
afterEach(() => vi.useRealTimers());
const opts = { numItems: 20, cursor: null };

test("all user identity analytics authenticate before lookup and deny every tenant-only role", async () => {
  const { t, ids } = await fixture();
  for (const reader of [t, t.withIdentity(identity(ids.member)), t.withIdentity(identity(ids.owner)), t.withIdentity(identity(ids.outsider))]) {
    await expect(reader.query(api.features.userAnalytics.users.listUsers, { paginationOpts: opts })).rejects.toThrow(reader === t ? "NOT_AUTHENTICATED" : "NOT_AUTHORIZED");
    await expect(reader.query(api.features.userAnalytics.users.getUserDetail, { userId: ids.member })).rejects.toThrow(reader === t ? "NOT_AUTHENTICATED" : "NOT_AUTHORIZED");
  }
});

test("list includes authenticated records without profiles and contains no fictional location or learning activity", async () => {
  const { admin, ids } = await fixture();
  const result = await admin.query(api.features.userAnalytics.users.listUsers, { paginationOpts: opts });
  expect(result.isDone).toBe(true);
  expect(result.page).toHaveLength(4);
  const unknown = result.page.find(row => row.userId === ids.outsider)!;
  expect(unknown).toMatchObject({ username: null, displayName: "Tanpa profil", email: "outsider@example.test", lastLearningAt: null, latestVisit: null, status: "belum-belajar" });
  expect(unknown.reads).toEqual({ value: 0, exact: true });
  expect(result.searchAppliedToPage).toBe(true);
  expect(JSON.stringify(result)).not.toContain("secret.example.test");
});

test("cursor pagination scans accounts exactly once and page search discloses its scope", async () => {
  const { admin } = await fixture();
  const first = await admin.query(api.features.userAnalytics.users.listUsers, { paginationOpts: { numItems: 2, cursor: null } });
  const next = await admin.query(api.features.userAnalytics.users.listUsers, { paginationOpts: { numItems: 2, cursor: first.continueCursor } });
  expect(new Set([...first.page, ...next.page].map(row => row.userId)).size).toBe(4);
  const searched = await admin.query(api.features.userAnalytics.users.listUsers, { paginationOpts: opts, search: "member@example.test" });
  expect(searched.page.map(row => row.username)).toEqual(["member"]);
  await expect(admin.query(api.features.userAnalytics.users.listUsers, { paginationOpts: { numItems: 1000, cursor: null } })).rejects.toThrow("VALIDATION_FAILED");
});

test("learning detail uses placement eligibility, cross-course completions and safe score projection", async () => {
  const { t, admin, ids } = await fixture();
  await t.run(async ctx => {
    await ctx.db.insert("lessonCompletions", { tenantId: ids.tenantId, userId: ids.member, lessonId: ids.lessonId });
    await ctx.db.insert("courseCompletions", { tenantId: ids.tenantId, userId: ids.member, courseId: ids.courseId });
    await ctx.db.insert("materiViews", { tenantId: ids.tenantId, userId: ids.member, lessonId: ids.lessonId, day: "2026-10-03" });
    await ctx.db.insert("quizAttempts", { tenantId: ids.tenantId, userId: ids.member, quizId: ids.quizId, answers: [1], scorePct: 100, passed: true });
    const draft = await ctx.db.insert("lessons", { tenantId: ids.tenantId, title: "Draft", contentMd: "", links: [], status: "draft" });
    await ctx.db.insert("courseLessons", { tenantId: ids.tenantId, courseId: ids.courseId, lessonId: draft, order: 1, lessonPublished: false });
    await ctx.db.insert("userActivityEvents", { userId: ids.member, at: NOW, expiresAt: NOW + 30 * 86400000, kind: "click", path: "/k/fixture/materi/dasar-ai", target: "https://example.test/resource", viewport: "desktop", country: "ID", city: "Bandung", referrerHost: "google.com", utmCampaign: "kelas-ai" });
  });
  const result = await admin.query(api.features.userAnalytics.users.getUserDetail, { userId: ids.member });
  expect(result.user).toMatchObject({ status: "memiliki-badge", lessonsCompleted: { value: 1, exact: true }, reads: { value: 1, exact: true }, quizAttempts: { value: 1, exact: true } });
  expect(result.user.lastLearningAt).toBeGreaterThanOrEqual(NOW);
  expect(result.user.lastLearningAt).toBeLessThan(NOW + 1);
  expect(result.courses[0]).toMatchObject({ total: 1, done: 1, percent: 100, isComplete: true, complete: true, badge: true });
  expect(result.reads[0]).toMatchObject({ title: "Dasar AI", communitySlug: "fixture" });
  expect(result.quizzes[0]).toMatchObject({ title: "Kuis", scorePct: 100, passed: true });
  expect(result.activity[0]).toMatchObject({ path: "/k/fixture/materi/dasar-ai", target: "https://example.test/resource", country: "ID", city: "Bandung" });
  const serialized = JSON.stringify(result);
  for (const forbidden of ["answers", "correctIndex", "SECRET_ANSWER", "discordWebhookUrl", "secret.example.test", "serverSecret"]) expect(serialized).not.toContain(forbidden);
});

test("legacy unknown placement cannot invent complete progress and suspended communities do not advertise courses", async () => {
  const { t, admin, ids } = await fixture();
  await t.run(async ctx => {
    for (let index = 0; index < 11; index++) {
      const lessonId = await ctx.db.insert("lessons", { tenantId: ids.tenantId, title: `Legacy ${index}`, contentMd: "", links: [] });
      await ctx.db.insert("courseLessons", { tenantId: ids.tenantId, courseId: ids.courseId, lessonId, order: index + 1 });
    }
  });
  const legacy = await admin.query(api.features.userAnalytics.users.getUserDetail, { userId: ids.member });
  expect(legacy.complete).toBe(false);
  expect(legacy.courses[0]).toMatchObject({ complete: false, percent: null, isComplete: false });
  await t.run(ctx => ctx.db.patch(ids.tenantId, { status: "suspended" }));
  const suspended = await admin.query(api.features.userAnalytics.users.getUserDetail, { userId: ids.member });
  expect(suspended.communities[0].status).toBe("suspended");
  expect(suspended.courses).toEqual([]);
});

test("large history exposes count lower bounds and bounded recent activity without old/future attribution", async () => {
  const { t, admin, ids } = await fixture();
  await t.run(async ctx => {
    for (let index = 0; index < 101; index++) await ctx.db.insert("userActivityEvents", { userId: ids.member, at: NOW - index, expiresAt: NOW + 86400000, kind: "page", path: "/home", viewport: "unknown" });
    await ctx.db.insert("userActivityEvents", { userId: ids.member, at: NOW - 31 * 86400000, expiresAt: NOW - 86400000, kind: "page", path: "/home", viewport: "unknown", country: "US" });
    await ctx.db.insert("userActivityEvents", { userId: ids.member, at: NOW + 86400000, expiresAt: NOW + 31 * 86400000, kind: "page", path: "/home", viewport: "unknown", country: "US" });
    for (let index = 0; index < 101; index++) await ctx.db.insert("lessonCompletions", { tenantId: ids.tenantId, userId: ids.member, lessonId: ids.lessonId });
  });
  const list = await admin.query(api.features.userAnalytics.users.listUsers, { paginationOpts: opts });
  expect(list.page.find(row => row.userId === ids.member)!.lessonsCompleted).toEqual({ value: 1, exact: false });
  const result = await admin.query(api.features.userAnalytics.users.getUserDetail, { userId: ids.member });
  expect(result.activity).toHaveLength(100);
  expect(result.activityComplete).toBe(false);
  expect(result.activity.every(row => row.country === undefined)).toBe(true);
});

test("oversized private documents exhaust a shared list budget without inventing exact zero activity or a normal admin role", async () => {
  const { t, admin } = await fixture();
  await t.run(async ctx => {
    for (let index = 0; index < 8; index++) {
      const userId = await ctx.db.insert("users", { email: `heavy-${index}@example.test` });
      await ctx.db.insert("profiles", { userId, username: `heavy-${index}`, displayName: `Heavy ${index}`, bio: index % 2 ? "x".repeat(500_000) : "漢".repeat(160_000), isPlatformAdmin: true });
    }
  });
  const result = await admin.query(api.features.userAnalytics.users.listUsers, { paginationOpts: opts });
  const unknown = result.page.filter(row => row.status === "belum-diketahui");
  expect(unknown.length).toBeGreaterThan(0);
  expect(unknown.every(row => !row.reads.exact && !row.lessonsCompleted.exact && row.isPlatformAdmin === null)).toBe(true);
  expect(JSON.stringify(result)).not.toContain("x".repeat(100));
});

test("displayed course badge stays exact when an account's badge history is truncated", async () => {
  const { t, admin, ids } = await fixture();
  await t.run(async ctx => {
    await ctx.db.insert("courseCompletions", { tenantId: ids.tenantId, userId: ids.member, courseId: ids.courseId });
    for (let index = 0; index < 100; index++) {
      const courseId = await ctx.db.insert("courses", { tenantId: ids.tenantId, createdBy: ids.owner, slug: `archived-${index}`, title: "Archived", description: "", status: "archived" });
      await ctx.db.insert("courseCompletions", { tenantId: ids.tenantId, userId: ids.member, courseId });
    }
  });
  const result = await admin.query(api.features.userAnalytics.users.getUserDetail, { userId: ids.member });
  expect(result.user.badges).toEqual({ value: 100, exact: false });
  expect(result.courses.find(row => row.courseId === ids.courseId)!.badge).toBe(true);
});

test("large legacy attempt answers stop indexed reads by byte budget and never reach the returned score history", async () => {
  const { t, admin, ids } = await fixture();
  await t.run(async ctx => {
    // Every document fits Convex's 8,192-element array ceiling; aggregate size reaches the read budget.
    for (let index = 0; index < 90; index++) await ctx.db.insert("quizAttempts", { tenantId: ids.tenantId, userId: ids.member, quizId: ids.quizId, scorePct: 0, passed: false, answers: Array(8_000).fill(0) });
  });
  const result = await admin.query(api.features.userAnalytics.users.getUserDetail, { userId: ids.member });
  expect(result.complete).toBe(false);
  expect(result.user.quizAttempts.exact).toBe(false);
  expect(result.quizzes.length).toBeLessThan(90);
  expect(JSON.stringify(result)).not.toContain("answers");
});
