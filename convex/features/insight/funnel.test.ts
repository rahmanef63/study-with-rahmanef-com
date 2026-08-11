/// <reference types="vite/client" />
// courseFunnel — the drop-off. Reads must stay in teaching order, count PEOPLE
// (not member-days), and survive a placement whose materi row is gone.
import { expect, test } from "vitest";
import { api } from "../../_generated/api";
import {
  asUser,
  insertCompletion,
  seedCourseWithLessons,
  seedTenantFixture,
  setup,
} from "./test.helpers";

test("empty course: no steps, zero denominators, no crash", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const { courseId } = await seedCourseWithLessons(t, fx, "published", 0);

  const funnel = await t
    .withIdentity(asUser(fx.instructorId))
    .query(api.features.insight.funnel.courseFunnel, { courseId });

  expect(funnel.steps).toEqual([]);
  expect(funnel.startedCount).toBe(0);
  expect(funnel.memberCount).toBe(4);
});

test("a course nobody has opened: every step reads zero, not null", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const { courseId } = await seedCourseWithLessons(t, fx, "published", 3);

  const funnel = await t
    .withIdentity(asUser(fx.instructorId))
    .query(api.features.insight.funnel.courseFunnel, { courseId });

  expect(funnel.steps).toHaveLength(3);
  expect(funnel.steps.map((s) => s.viewedCount)).toEqual([0, 0, 0]);
  expect(funnel.steps.map((s) => s.retentionPct)).toEqual([0, 0, 0]);
  expect(funnel.steps.map((s) => s.completionRatePct)).toEqual([0, 0, 0]);
});

test("steps come back in teaching order", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const { courseId } = await seedCourseWithLessons(t, fx, "published", 4);

  const funnel = await t
    .withIdentity(asUser(fx.ownerId))
    .query(api.features.insight.funnel.courseFunnel, { courseId });

  expect(funnel.steps.map((s) => s.order)).toEqual([1, 2, 3, 4]);
  expect(funnel.steps.map((s) => s.title)).toEqual([
    "Materi 1",
    "Materi 2",
    "Materi 3",
    "Materi 4",
  ]);
});

test("the drop-off: two members start, one reaches the end", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const { courseId, lessonIds } = await seedCourseWithLessons(t, fx, "published", 3);
  const one = t.withIdentity(asUser(fx.memberId));
  const two = t.withIdentity(asUser(fx.member2Id));

  await one.mutation(api.features.insight.views.recordView, { lessonId: lessonIds[0] });
  await two.mutation(api.features.insight.views.recordView, { lessonId: lessonIds[0] });
  await one.mutation(api.features.insight.views.recordView, { lessonId: lessonIds[1] });
  await one.mutation(api.features.insight.views.recordView, { lessonId: lessonIds[2] });
  await insertCompletion(t, fx, fx.memberId, lessonIds[0], courseId);
  await insertCompletion(t, fx, fx.member2Id, lessonIds[0], courseId);
  await insertCompletion(t, fx, fx.memberId, lessonIds[1], courseId);

  const funnel = await t
    .withIdentity(asUser(fx.instructorId))
    .query(api.features.insight.funnel.courseFunnel, { courseId });

  expect(funnel.startedCount).toBe(2);
  expect(funnel.steps.map((s) => s.viewedCount)).toEqual([2, 1, 1]);
  expect(funnel.steps.map((s) => s.completedCount)).toEqual([2, 1, 0]);
  expect(funnel.steps.map((s) => s.retentionPct)).toEqual([100, 50, 50]);
  // Read but not finished: the last step is where they stopped.
  expect(funnel.steps.map((s) => s.completionRatePct)).toEqual([100, 100, 0]);
});

test("one obsessive re-reader is one viewer, several views", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const { courseId, lessonIds } = await seedCourseWithLessons(t, fx, "published", 1);

  await t.run(async (ctx) => {
    for (const day of ["2026-08-09", "2026-08-10", "2026-08-11"]) {
      await ctx.db.insert("materiViews", {
        tenantId: fx.tenantId,
        lessonId: lessonIds[0],
        userId: fx.memberId,
        day,
      });
    }
    await ctx.db.insert("materiViewCounts", {
      tenantId: fx.tenantId,
      lessonId: lessonIds[0],
      views: 3,
      viewers: 1,
      lastViewedAt: Date.now(),
    });
  });

  const funnel = await t
    .withIdentity(asUser(fx.instructorId))
    .query(api.features.insight.funnel.courseFunnel, { courseId });

  expect(funnel.steps[0].viewCount).toBe(3);
  expect(funnel.steps[0].viewedCount).toBe(1);
  expect(funnel.startedCount).toBe(1); // NOT 3 — the funnel counts people
});

test("a duplicate legacy completion row cannot push a count past the headcount", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const { courseId, lessonIds } = await seedCourseWithLessons(t, fx, "published", 1);
  await insertCompletion(t, fx, fx.memberId, lessonIds[0], courseId);
  await insertCompletion(t, fx, fx.memberId, lessonIds[0], courseId);

  const funnel = await t
    .withIdentity(asUser(fx.instructorId))
    .query(api.features.insight.funnel.courseFunnel, { courseId });
  expect(funnel.steps[0].completedCount).toBe(1);
});

test("a placement whose materi is deleted is skipped, not rendered blank", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const { courseId, lessonIds } = await seedCourseWithLessons(t, fx, "published", 3);
  await t.run(async (ctx) => {
    await ctx.db.delete(lessonIds[1]);
  });

  const funnel = await t
    .withIdentity(asUser(fx.instructorId))
    .query(api.features.insight.funnel.courseFunnel, { courseId });

  expect(funnel.steps).toHaveLength(2);
  expect(funnel.steps.map((s) => s.order)).toEqual([1, 3]);
});

test("a materi shared by two courses is counted once in each", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const a = await seedCourseWithLessons(t, fx, "published", 1, "kelas-a");
  const b = await seedCourseWithLessons(t, fx, "published", 0, "kelas-b");
  await t.run(async (ctx) => {
    await ctx.db.insert("courseLessons", {
      tenantId: fx.tenantId,
      courseId: b.courseId,
      lessonId: a.lessonIds[0],
      order: 1,
    });
  });
  await t
    .withIdentity(asUser(fx.memberId))
    .mutation(api.features.insight.views.recordView, { lessonId: a.lessonIds[0] });

  const asInstructor = t.withIdentity(asUser(fx.instructorId));
  const funnelA = await asInstructor.query(api.features.insight.funnel.courseFunnel, {
    courseId: a.courseId,
  });
  const funnelB = await asInstructor.query(api.features.insight.funnel.courseFunnel, {
    courseId: b.courseId,
  });
  expect(funnelA.steps[0].viewedCount).toBe(1);
  expect(funnelB.steps[0].viewedCount).toBe(1);
});

test("draft course: instructor still gets its funnel (kelola manages drafts)", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const { courseId } = await seedCourseWithLessons(t, fx, "draft", 2);

  const funnel = await t
    .withIdentity(asUser(fx.instructorId))
    .query(api.features.insight.funnel.courseFunnel, { courseId });
  expect(funnel.course.status).toBe("draft");
  expect(funnel.steps).toHaveLength(2);
});

test("views from ANOTHER tenant's materi never bleed in", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const other = await seedTenantFixture(t, "komunitas-lain");
  const { courseId, lessonIds } = await seedCourseWithLessons(t, fx, "published", 1);
  const theirs = await seedCourseWithLessons(t, other, "published", 1, "kelas-lain");

  await t
    .withIdentity(asUser(other.memberId))
    .mutation(api.features.insight.views.recordView, { lessonId: theirs.lessonIds[0] });

  const funnel = await t
    .withIdentity(asUser(fx.instructorId))
    .query(api.features.insight.funnel.courseFunnel, { courseId });
  expect(funnel.steps[0].lessonId).toBe(lessonIds[0]);
  expect(funnel.steps[0].viewedCount).toBe(0);
});
