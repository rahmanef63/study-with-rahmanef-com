/// <reference types="vite/client" />
import { expect, test, vi } from "vitest";
import { makeFunctionReference } from "convex/server";
import { api } from "../../_generated/api";
import type { Id } from "../../_generated/dataModel";
import { asUser, placeLesson, seedCourseWithLessons, seedMateri, seedTenantFixture, setup } from "./test.helpers";

const settle = makeFunctionReference<"mutation", {
  userId: Id<"users">; lessonId: Id<"lessons">; courseId: Id<"courses">;
}, boolean>("features/progress/settleCourse:settle");

test("one shared lesson settles all50 courses in bounded jobs, without duplicate badges", async () => {
  vi.useFakeTimers();
  try {
    const t = setup();
    const fx = await seedTenantFixture(t);
    const shared = await seedMateri(t, fx);
    for (let i = 0; i < 50; i++) {
      const { courseId } = await seedCourseWithLessons(t, fx, "published", 0, `shared-${i}`);
      await placeLesson(t, fx, courseId, shared, 1);
    }
    const caller = t.withIdentity(asUser(fx.memberId));
    const result = await caller.mutation(api.features.progress.mutations.markLessonComplete, { lessonId: shared });
    expect(result.courses).toHaveLength(3);
    expect(result.pendingCourses).toBe(47);
    await t.finishAllScheduledFunctions(() => vi.runAllTimers());
    await t.run(async (ctx) => {
      expect(await ctx.db.query("lessonCompletions").collect()).toHaveLength(1);
      expect(await ctx.db.query("courseCompletions").collect()).toHaveLength(50);
    });
    const repeated = await caller.mutation(api.features.progress.mutations.markLessonComplete, { lessonId: shared });
    expect(repeated.wasAlreadyComplete).toBe(true);
    expect(repeated.pendingCourses).toBeUndefined();
    await t.finishAllScheduledFunctions(() => vi.runAllTimers());
    await t.run(async (ctx) => { expect(await ctx.db.query("courseCompletions").collect()).toHaveLength(50); });
  } finally { vi.useRealTimers(); }
});

test("re-marking an existing completion settles newly added courses beyond the immediate batch", async () => {
  vi.useFakeTimers();
  try {
    const t = setup();
    const fx = await seedTenantFixture(t);
    const shared = await seedMateri(t, fx);
    for (let i = 0; i < 3; i++) {
      const { courseId } = await seedCourseWithLessons(t, fx, "published", 0, `before-${i}`);
      await placeLesson(t, fx, courseId, shared, 1);
    }
    const caller = t.withIdentity(asUser(fx.memberId));
    await caller.mutation(api.features.progress.mutations.markLessonComplete, { lessonId: shared });
    const { courseId } = await seedCourseWithLessons(t, fx, "published", 0, "added-later");
    await placeLesson(t, fx, courseId, shared, 1);
    const repeat = await caller.mutation(api.features.progress.mutations.markLessonComplete, { lessonId: shared });
    expect(repeat).toMatchObject({ wasAlreadyComplete: true, pendingCourses: 1 });
    await t.finishAllScheduledFunctions(() => vi.runAllTimers());
    await t.run(async (ctx) => { expect(await ctx.db.query("courseCompletions").collect()).toHaveLength(4); });
  } finally { vi.useRealTimers(); }
});

test.each(["membership", "tenant", "course", "placement", "completion", "lesson"] as const)(
  "scheduled settlement rejects revoked %s state", async (revoked) => {
    const t = setup();
    const fx = await seedTenantFixture(t);
    const { courseId, lessonIds } = await seedCourseWithLessons(t, fx, "published", 1);
    await t.run(async (ctx) => {
      const completion = await ctx.db.insert("lessonCompletions", {
        tenantId: fx.tenantId, userId: fx.memberId, lessonId: lessonIds[0],
      });
      if (revoked === "membership") {
        const member = await ctx.db.query("memberships").withIndex("by_tenant_user", (q) => q.eq("tenantId", fx.tenantId).eq("userId", fx.memberId)).first();
        await ctx.db.delete(member!._id);
      }
      if (revoked === "tenant") await ctx.db.patch(fx.tenantId, { status: "suspended" });
      if (revoked === "course") await ctx.db.patch(courseId, { status: "draft" });
      if (revoked === "placement") {
        const placement = await ctx.db.query("courseLessons").withIndex("by_course", (q) => q.eq("courseId", courseId)).first();
        await ctx.db.delete(placement!._id);
      }
      if (revoked === "completion") await ctx.db.delete(completion);
      if (revoked === "lesson") await ctx.db.patch(lessonIds[0], { status: "draft" });
    });
    expect(await t.mutation(settle, { userId: fx.memberId, lessonId: lessonIds[0], courseId })).toBe(false);
    await t.run(async (ctx) => { expect(await ctx.db.query("courseCompletions").collect()).toEqual([]); });
  }
);

test("scheduled settlement never retries or badges a truncated legacy roster", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const { courseId, lessonIds } = await seedCourseWithLessons(t, fx, "published", 11);
  await t.run(async (ctx) => {
    for (const lessonId of lessonIds) await ctx.db.insert("lessonCompletions", {
      tenantId: fx.tenantId, userId: fx.memberId, lessonId,
    });
  });
  expect(await t.mutation(settle, { userId: fx.memberId, lessonId: lessonIds[0], courseId })).toBe(false);
  await t.run(async (ctx) => {
    expect(await ctx.db.query("courseCompletions").collect()).toEqual([]);
    expect(await ctx.db.system.query("_scheduled_functions").collect()).toEqual([]);
  });
});
