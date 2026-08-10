/// <reference types="vite/client" />
// Placement mutations (manage.addLessonToCourse / removeLessonFromCourse /
// reorderCourseLessons) — the console surface of the materi model.
// P0: every spec exercises the authz-denied path (anon + member).
// The load-bearing one: removing a materi from a course must NOT delete the
// materi — it is shared, and deleting it would silently gut another course.
import { expect, test } from "vitest";
import { api } from "../../_generated/api";
import { asUser, placeMateri, seedCourse, seedMateri, seedTenantFixture, setup } from "./test.helpers";

test("addLessonToCourse: anon + member denied, instructor appends at the end", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const { courseId, lessonId } = await seedCourse(t, fx, "draft");
  const materiId = await seedMateri(t, fx, { title: "Materi 2", slug: "materi-2" });
  const args = { courseId, lessonId: materiId };

  await expect(
    t.mutation(api.features.courses.manage.addLessonToCourse, args)
  ).rejects.toThrow(/NOT_AUTHENTICATED/);
  await expect(
    t.withIdentity(asUser(fx.memberId)).mutation(api.features.courses.manage.addLessonToCourse, args)
  ).rejects.toThrow(/NOT_AUTHORIZED/);

  await t
    .withIdentity(asUser(fx.instructorId))
    .mutation(api.features.courses.manage.addLessonToCourse, args);
  const overview = await t
    .withIdentity(asUser(fx.instructorId))
    .query(api.features.courses.manage.getCourseForManage, { courseId });
  expect(overview.lessons.map((l) => l._id)).toEqual([lessonId, materiId]);
  expect(overview.lessons[1].order).toBe(2);
});

test("addLessonToCourse: the same materi twice is VALIDATION_FAILED", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const { courseId, lessonId } = await seedCourse(t, fx, "draft");

  await expect(
    t
      .withIdentity(asUser(fx.instructorId))
      .mutation(api.features.courses.manage.addLessonToCourse, { courseId, lessonId })
  ).rejects.toThrow(/VALIDATION_FAILED/);
});

test("addLessonToCourse: a materi from ANOTHER tenant reads as NOT_FOUND", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const { courseId } = await seedCourse(t, fx, "draft");
  const foreignLessonId = await t.run(async (ctx) => {
    const ownerId = await ctx.db.insert("users", { email: "lain@test.id" });
    const tenantId = await ctx.db.insert("tenants", {
      slug: "komunitas-lain",
      name: "Komunitas Lain",
      description: "Tenant kedua",
      status: "active",
      ownerId,
    });
    return ctx.db.insert("lessons", {
      tenantId,
      title: "Materi Tetangga",
      slug: "materi-tetangga",
      status: "published",
      contentMd: "rahasia tetangga",
      links: [],
    });
  });

  await expect(
    t.withIdentity(asUser(fx.instructorId)).mutation(
      api.features.courses.manage.addLessonToCourse,
      { courseId, lessonId: foreignLessonId }
    )
  ).rejects.toThrow(/NOT_FOUND/);
});

test("removeLessonFromCourse: unplaces ONLY — the materi and its other course survive", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const a = await seedCourse(t, fx, "published", "kelas-a");
  const b = await seedCourse(t, fx, "published", "kelas-b");
  const shared = await seedMateri(t, fx, { title: "Materi Bersama", slug: "materi-bersama" });
  await placeMateri(t, fx, a.courseId, shared, 2);
  await placeMateri(t, fx, b.courseId, shared, 2);
  const args = { courseId: a.courseId, lessonId: shared };

  await expect(
    t.withIdentity(asUser(fx.memberId)).mutation(
      api.features.courses.manage.removeLessonFromCourse,
      args
    )
  ).rejects.toThrow(/NOT_AUTHORIZED/);

  await t
    .withIdentity(asUser(fx.instructorId))
    .mutation(api.features.courses.manage.removeLessonFromCourse, args);

  // The materi row is untouched…
  const materi = await t.run(async (ctx) => ctx.db.get(shared));
  expect(materi).not.toBeNull();
  expect(materi?.title).toBe("Materi Bersama");
  // …kelas-a no longer teaches it…
  const inA = await t.query(api.features.courses.queries.getOverview, {
    tenantId: fx.tenantId,
    courseSlug: "kelas-a",
  });
  expect(inA.lessons.map((l) => l._id)).not.toContain(shared);
  // …and kelas-b still does.
  const inB = await t.query(api.features.courses.queries.getOverview, {
    tenantId: fx.tenantId,
    courseSlug: "kelas-b",
  });
  expect(inB.lessons.map((l) => l._id)).toContain(shared);
});

test("removeLessonFromCourse: a materi that is not in the course is NOT_FOUND", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const { courseId } = await seedCourse(t, fx, "draft");
  const loose = await seedMateri(t, fx, { title: "Materi Lepas", slug: "materi-lepas" });

  await expect(
    t.withIdentity(asUser(fx.instructorId)).mutation(
      api.features.courses.manage.removeLessonFromCourse,
      { courseId, lessonId: loose }
    )
  ).rejects.toThrow(/NOT_FOUND/);
});

test("reorderCourseLessons: rejects a non-permutation, applies 1-based placement order", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const { courseId, lessonId } = await seedCourse(t, fx, "published");
  const secondId = await seedMateri(t, fx, { title: "Materi 2", slug: "materi-2" });
  await placeMateri(t, fx, courseId, secondId, 2);
  const asInstructor = t.withIdentity(asUser(fx.instructorId));

  await expect(
    t.withIdentity(asUser(fx.memberId)).mutation(
      api.features.courses.manage.reorderCourseLessons,
      { courseId, orderedLessonIds: [secondId, lessonId] }
    )
  ).rejects.toThrow(/NOT_AUTHORIZED/);
  await expect(
    asInstructor.mutation(api.features.courses.manage.reorderCourseLessons, {
      courseId,
      orderedLessonIds: [secondId], // missing one placement
    })
  ).rejects.toThrow(/VALIDATION_FAILED/);
  await expect(
    asInstructor.mutation(api.features.courses.manage.reorderCourseLessons, {
      courseId,
      orderedLessonIds: [secondId, secondId], // duplicate
    })
  ).rejects.toThrow(/VALIDATION_FAILED/);

  await asInstructor.mutation(api.features.courses.manage.reorderCourseLessons, {
    courseId,
    orderedLessonIds: [secondId, lessonId],
  });
  const overview = await t.query(api.features.courses.queries.getOverview, {
    tenantId: fx.tenantId,
    courseSlug: "kelas-published",
  });
  expect(overview.lessons.map((l) => l._id)).toEqual([secondId, lessonId]);
  expect(overview.lessons.map((l) => l.order)).toEqual([1, 2]);
});

test("reorderCourseLessons: a materi from another course cannot be smuggled in", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const a = await seedCourse(t, fx, "published", "kelas-a");
  const b = await seedCourse(t, fx, "published", "kelas-b");

  await expect(
    t.withIdentity(asUser(fx.instructorId)).mutation(
      api.features.courses.manage.reorderCourseLessons,
      { courseId: a.courseId, orderedLessonIds: [b.lessonId] }
    )
  ).rejects.toThrow(/VALIDATION_FAILED/);
});
