/// <reference types="vite/client" />
import { expect, test, vi } from "vitest";
import { api } from "../../_generated/api";
import { deriveCourseProgress } from "./derive";
import { asUser, seedCourseWithLessons, seedTenantFixture, setup } from "./test.helpers";

test("200 snapshot placements derive exact progress without reading lesson bodies", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const { courseId, lessonIds } = await seedCourseWithLessons(t, fx, "published", 200);
  await t.run(async (ctx) => {
    const placements = await ctx.db.query("courseLessons").withIndex("by_course", (q) => q.eq("courseId", courseId)).take(200);
    for (const placement of placements) {
      await ctx.db.patch(placement._id, { lessonPublished: true });
      await ctx.db.patch(placement.lessonId, { contentMd: "x".repeat(50_000), contentBlocks: "x".repeat(400_000) });
      await ctx.db.insert("lessonCompletions", { tenantId: fx.tenantId, userId: fx.memberId, lessonId: placement.lessonId });
    }
    const get = vi.spyOn(ctx.db, "get");
    try {
      const progress = await deriveCourseProgress(ctx, fx.memberId, courseId);
      expect(progress).toMatchObject({ completedCount: 200, totalCount: 200, isComplete: true });
      expect(progress.completedLessonIds).toEqual(lessonIds);
      expect(get.mock.calls).toEqual([[courseId]]);
    } finally { get.mockRestore(); }
  });
  const progress = await t.withIdentity(asUser(fx.memberId)).query(api.features.progress.queries.getCourseProgress, { courseId });
  expect(progress.isComplete).toBe(true);
  expect(progress.completedCount).toBe(200);
}, 30_000);

test("legacy reads stop at10; incomplete visibility never produces a badge or overview percentage", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const { courseId, lessonIds } = await seedCourseWithLessons(t, fx, "published", 11);
  await t.run(async (ctx) => {
    for (const lessonId of lessonIds) await ctx.db.insert("lessonCompletions", {
      tenantId: fx.tenantId, userId: fx.memberId, lessonId,
    });
    const get = vi.spyOn(ctx.db, "get");
    try {
      const progress = await deriveCourseProgress(ctx, fx.memberId, courseId);
      expect(progress).toMatchObject({ completedCount: 10, totalCount: 10, isComplete: false, truncated: true });
      expect(get).toHaveBeenCalledTimes(11); // One course +10full lesson docs.
    } finally { get.mockRestore(); }
  });
  const caller = t.withIdentity(asUser(fx.memberId));
  const outcome = await caller.mutation(api.features.progress.mutations.markLessonComplete, { lessonId: lessonIds[0] });
  expect(outcome.courseCompleted).toBe(false);
  expect(outcome.courses[0].truncated).toBe(true);
  const overview = await caller.query(api.features.progress.overview.getMine, {});
  expect(overview).toMatchObject({ inProgress: [], notStarted: [], completedCount: 0, truncated: true });
  await t.run(async (ctx) => { expect(await ctx.db.query("courseCompletions").collect()).toEqual([]); });
});

test("a legacy course over200 placements cannot complete or mint a badge from a truncated roster", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const { courseId, lessonIds } = await seedCourseWithLessons(t, fx, "published", 201);
  await t.run(async (ctx) => {
    const placements = await ctx.db.query("courseLessons")
      .withIndex("by_course", (q) => q.eq("courseId", courseId)).take(201);
    for (const [index, placement] of placements.entries()) {
      await ctx.db.patch(placement._id, { lessonPublished: true });
      if (index < 200) await ctx.db.insert("lessonCompletions", {
        tenantId: fx.tenantId, userId: fx.memberId, lessonId: placement.lessonId,
      });
    }
  });
  const caller = t.withIdentity(asUser(fx.memberId));
  const progress = await caller.query(api.features.progress.queries.getCourseProgress, { courseId });
  expect(progress).toMatchObject({ completedCount: 200, totalCount: 200, isComplete: false, truncated: true });
  const result = await caller.mutation(api.features.progress.mutations.markLessonComplete, { lessonId: lessonIds[0] });
  expect(result.courseCompleted).toBe(false);
  expect(result.courses[0]).toMatchObject({ isComplete: false, truncated: true });
  await t.run(async (ctx) => { expect(await ctx.db.query("courseCompletions").collect()).toEqual([]); });
}, 30_000);

test("overview analyzes at most10 exact courses even with a long completion history", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  for (let course = 0; course < 11; course++) {
    const { courseId } = await seedCourseWithLessons(t, fx, "published", 60, `stress-${course}`);
    await t.run(async (ctx) => {
      const placements = await ctx.db.query("courseLessons").withIndex("by_course", (q) => q.eq("courseId", courseId)).take(200);
      for (const [index, placement] of placements.entries()) {
        await ctx.db.patch(placement._id, { lessonPublished: true });
        if (index < 50) await ctx.db.insert("lessonCompletions", {
          tenantId: fx.tenantId, userId: fx.memberId, lessonId: placement.lessonId,
        });
      }
    });
  }
  const overview = await t.withIdentity(asUser(fx.memberId)).query(api.features.progress.overview.getMine, {});
  expect(overview.inProgress).toHaveLength(10);
  expect(overview.inProgress.every((course) => course.done === 50 && course.total === 60 && course.percent === 83)).toBe(true);
  expect(overview.truncated).toBe(true);
}, 30_000);
