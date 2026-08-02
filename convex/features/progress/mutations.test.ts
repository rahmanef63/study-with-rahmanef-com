/// <reference types="vite/client" />
// markLessonComplete — the P0 paths from docs/AGENT-PROMPTS.md epsilon:
// authz-denied (anon + non-member), idempotency (lesson + course), userId from
// ctx (never args), and course completion / badge creation.
import { expect, test } from "vitest";
import { api } from "../../_generated/api";
import { asUser, seedCourseWithLessons, seedTenantFixture, setup } from "./test.helpers";

test("markLessonComplete: anon is NOT_AUTHENTICATED, non-member is NOT_AUTHORIZED", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const { lessonIds } = await seedCourseWithLessons(t, fx, "published", 1);

  await expect(
    t.mutation(api.features.progress.mutations.markLessonComplete, { lessonId: lessonIds[0] })
  ).rejects.toThrow(/NOT_AUTHENTICATED/);

  await expect(
    t
      .withIdentity(asUser(fx.outsiderId))
      .mutation(api.features.progress.mutations.markLessonComplete, { lessonId: lessonIds[0] })
  ).rejects.toThrow(/NOT_AUTHORIZED/);

  await t.run(async (ctx) => {
    expect(await ctx.db.query("lessonCompletions").collect()).toHaveLength(0);
  });
});

test("markLessonComplete: records the caller's own completion and is idempotent", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const { courseId, lessonIds } = await seedCourseWithLessons(t, fx, "published", 2);
  const asMember = t.withIdentity(asUser(fx.memberId));

  const first = await asMember.mutation(api.features.progress.mutations.markLessonComplete, {
    lessonId: lessonIds[0],
  });
  expect(first).toMatchObject({
    wasAlreadyComplete: false,
    courseCompleted: false,
    completedCount: 1,
    totalCount: 2,
  });

  // userId is resolved from ctx (the args validator has no userId field): the
  // stored row belongs to the authenticated member, and is scoped by tenant.
  await t.run(async (ctx) => {
    const rows = await ctx.db.query("lessonCompletions").collect();
    expect(rows).toHaveLength(1);
    expect(rows[0].userId).toBe(fx.memberId);
    expect(rows[0].tenantId).toBe(fx.tenantId);
    expect(rows[0].courseId).toBe(courseId);
  });

  const again = await asMember.mutation(api.features.progress.mutations.markLessonComplete, {
    lessonId: lessonIds[0],
  });
  expect(again.wasAlreadyComplete).toBe(true);
  await t.run(async (ctx) => {
    expect(await ctx.db.query("lessonCompletions").collect()).toHaveLength(1);
  });
});

test("markLessonComplete: finishing the last lesson creates courseCompletion once (idempotent badge)", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const { courseId, lessonIds } = await seedCourseWithLessons(t, fx, "published", 2);
  const asMember = t.withIdentity(asUser(fx.memberId));

  await asMember.mutation(api.features.progress.mutations.markLessonComplete, {
    lessonId: lessonIds[0],
  });
  const last = await asMember.mutation(api.features.progress.mutations.markLessonComplete, {
    lessonId: lessonIds[1],
  });
  expect(last).toMatchObject({ courseCompleted: true, completedCount: 2, totalCount: 2 });

  await t.run(async (ctx) => {
    const completions = await ctx.db
      .query("courseCompletions")
      .withIndex("by_user_course", (q) => q.eq("userId", fx.memberId).eq("courseId", courseId))
      .collect();
    expect(completions).toHaveLength(1);
    expect(completions[0].tenantId).toBe(fx.tenantId);
  });

  // Re-marking an already-complete lesson must not mint a second badge.
  await asMember.mutation(api.features.progress.mutations.markLessonComplete, {
    lessonId: lessonIds[1],
  });
  await t.run(async (ctx) => {
    expect(await ctx.db.query("courseCompletions").collect()).toHaveLength(1);
  });
});

test("markLessonComplete: a member cannot complete a lesson of a DRAFT course (NOT_FOUND)", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const { lessonIds } = await seedCourseWithLessons(t, fx, "draft", 1);

  await expect(
    t
      .withIdentity(asUser(fx.memberId))
      .mutation(api.features.progress.mutations.markLessonComplete, { lessonId: lessonIds[0] })
  ).rejects.toThrow(/NOT_FOUND/);

  await t.run(async (ctx) => {
    expect(await ctx.db.query("lessonCompletions").collect()).toHaveLength(0);
    expect(await ctx.db.query("courseCompletions").collect()).toHaveLength(0);
  });
});
