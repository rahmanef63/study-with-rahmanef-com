/// <reference types="vite/client" />
// Authz-ORDER regression specs (review fix #2; STATUS drift log 2026-07-06).
// Design: agent gamma (final report); landed at integrator review by alpha.
//
// Discriminator = a DANGLING id (seed → delete → call as anonymous). Under the
// old read-first code the deleted id resolved to null → NOT_FOUND (existence
// oracle for anonymous callers). Under the fix, requireUser rejects with
// NOT_AUTHENTICATED before any DB read — so these specs FAIL on the old code
// and PASS on the fixed code.
import { expect, test } from "vitest";
import { api } from "../../_generated/api";
import { asUser, seedCourse, seedTenantFixture, setup } from "./test.helpers";

async function danglingFixture() {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const c = await seedCourse(t, fx, "published", "kelas-dangling");
  await t.run(async (ctx) => {
    await ctx.db.delete(c.placementId);
    await ctx.db.delete(c.lessonId);
    await ctx.db.delete(c.courseId);
  });
  return { t, fx, ...c };
}

test("getLesson: anonymous + dangling id → NOT_AUTHENTICATED (never NOT_FOUND)", async () => {
  const { t, lessonId } = await danglingFixture();
  await expect(
    t.query(api.features.courses.queries.getLesson, { lessonId })
  ).rejects.toThrow(/NOT_AUTHENTICATED/);
});

test("getCourseForManage: anon dangling → NOT_AUTHENTICATED; member → NOT_AUTHORIZED; instructor → course", async () => {
  const { t, fx, courseId } = await danglingFixture();
  await expect(
    t.query(api.features.courses.manage.getCourseForManage, { courseId })
  ).rejects.toThrow(/NOT_AUTHENTICATED/);

  const real = await seedCourse(t, fx, "draft", "kelas-nyata");
  await expect(
    t
      .withIdentity(asUser(fx.memberId))
      .query(api.features.courses.manage.getCourseForManage, { courseId: real.courseId })
  ).rejects.toThrow(/NOT_AUTHORIZED/);

  const tree = await t
    .withIdentity(asUser(fx.instructorId))
    .query(api.features.courses.manage.getCourseForManage, { courseId: real.courseId });
  expect(tree.course._id).toBe(real.courseId);
});

test("courses.update: anonymous + dangling id → NOT_AUTHENTICATED", async () => {
  const { t, courseId } = await danglingFixture();
  await expect(
    t.mutation(api.features.courses.courses.update, { courseId, title: "Judul Baru" })
  ).rejects.toThrow(/NOT_AUTHENTICATED/);
});

test("lessons.updateLesson: anonymous + dangling id → NOT_AUTHENTICATED", async () => {
  const { t, lessonId } = await danglingFixture();
  await expect(
    t.mutation(api.features.courses.lessons.updateLesson, { lessonId, title: "Materi Baru" })
  ).rejects.toThrow(/NOT_AUTHENTICATED/);
});

test("manage placement mutations: anonymous + dangling ids → NOT_AUTHENTICATED", async () => {
  const { t, courseId, lessonId } = await danglingFixture();
  await expect(
    t.mutation(api.features.courses.manage.addLessonToCourse, { courseId, lessonId })
  ).rejects.toThrow(/NOT_AUTHENTICATED/);
  await expect(
    t.mutation(api.features.courses.manage.removeLessonFromCourse, { courseId, lessonId })
  ).rejects.toThrow(/NOT_AUTHENTICATED/);
  await expect(
    t.mutation(api.features.courses.manage.reorderCourseLessons, {
      courseId,
      orderedLessonIds: [lessonId],
    })
  ).rejects.toThrow(/NOT_AUTHENTICATED/);
});
