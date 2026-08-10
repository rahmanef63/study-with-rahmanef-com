/// <reference types="vite/client" />
// getCourseProgress / getLessonCompletion — authz-denied paths (anon +
// non-member) plus derived-count correctness. Completions are inserted
// directly here so the read surface is exercised independently of the mutation.
import { expect, test } from "vitest";
import type { Id } from "../../_generated/dataModel";
import { api } from "../../_generated/api";
import {
  asUser,
  placeLesson,
  seedCourseWithLessons,
  seedMateri,
  seedTenantFixture,
  setup,
  type T,
} from "./test.helpers";

async function complete(
  t: T,
  ids: { tenantId: Id<"tenants">; userId: Id<"users">; courseId?: Id<"courses">; lessonId: Id<"lessons"> }
) {
  await t.run(async (ctx) => {
    await ctx.db.insert("lessonCompletions", ids);
  });
}

test("getCourseProgress: anon NOT_AUTHENTICATED, non-member NOT_AUTHORIZED", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const { courseId } = await seedCourseWithLessons(t, fx, "published", 2);

  await expect(
    t.query(api.features.progress.queries.getCourseProgress, { courseId })
  ).rejects.toThrow(/NOT_AUTHENTICATED/);
  await expect(
    t
      .withIdentity(asUser(fx.outsiderId))
      .query(api.features.progress.queries.getCourseProgress, { courseId })
  ).rejects.toThrow(/NOT_AUTHORIZED/);
});

test("getCourseProgress: counts are derived and completedLessonIds track completions", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const { courseId, lessonIds } = await seedCourseWithLessons(t, fx, "published", 2);
  const asMember = t.withIdentity(asUser(fx.memberId));

  const empty = await asMember.query(api.features.progress.queries.getCourseProgress, { courseId });
  expect(empty).toMatchObject({ completedCount: 0, totalCount: 2, isComplete: false });
  expect(empty.completedLessonIds).toEqual([]);

  await complete(t, { tenantId: fx.tenantId, userId: fx.memberId, courseId, lessonId: lessonIds[0] });
  const partial = await asMember.query(api.features.progress.queries.getCourseProgress, {
    courseId,
  });
  expect(partial).toMatchObject({ completedCount: 1, totalCount: 2, isComplete: false });
  expect(partial.completedLessonIds).toEqual([lessonIds[0]]);

  await complete(t, { tenantId: fx.tenantId, userId: fx.memberId, courseId, lessonId: lessonIds[1] });
  const done = await asMember.query(api.features.progress.queries.getCourseProgress, { courseId });
  expect(done).toMatchObject({ completedCount: 2, totalCount: 2, isComplete: true });
});

test("getCourseProgress: draft course is NOT_FOUND for member, readable by instructor", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const { courseId } = await seedCourseWithLessons(t, fx, "draft", 1);

  await expect(
    t
      .withIdentity(asUser(fx.memberId))
      .query(api.features.progress.queries.getCourseProgress, { courseId })
  ).rejects.toThrow(/NOT_FOUND/);

  const asInstructor = await t
    .withIdentity(asUser(fx.instructorId))
    .query(api.features.progress.queries.getCourseProgress, { courseId });
  expect(asInstructor).toMatchObject({ completedCount: 0, totalCount: 1, isComplete: false });
});

test("getLessonCompletion: authz-denied paths + reflects the caller's own completion", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const { courseId, lessonIds } = await seedCourseWithLessons(t, fx, "published", 1);
  const lessonId = lessonIds[0];

  await expect(
    t.query(api.features.progress.queries.getLessonCompletion, { lessonId })
  ).rejects.toThrow(/NOT_AUTHENTICATED/);
  await expect(
    t
      .withIdentity(asUser(fx.outsiderId))
      .query(api.features.progress.queries.getLessonCompletion, { lessonId })
  ).rejects.toThrow(/NOT_AUTHORIZED/);

  const asMember = t.withIdentity(asUser(fx.memberId));
  expect(await asMember.query(api.features.progress.queries.getLessonCompletion, { lessonId })).toEqual(
    { isCompleted: false }
  );

  await complete(t, { tenantId: fx.tenantId, userId: fx.memberId, courseId, lessonId });
  expect(await asMember.query(api.features.progress.queries.getLessonCompletion, { lessonId })).toEqual(
    { isCompleted: true }
  );
});

test("getLessonCompletion: gate is the MATERI status, not the course status", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  // Published materi inside a DRAFT course — readable: materi is tenant-level.
  const { lessonIds } = await seedCourseWithLessons(t, fx, "draft", 1);
  const asMember = t.withIdentity(asUser(fx.memberId));
  expect(
    await asMember.query(api.features.progress.queries.getLessonCompletion, {
      lessonId: lessonIds[0],
    })
  ).toEqual({ isCompleted: false });

  // Draft materi — hidden from members, visible to instructor+.
  const draft = await seedMateri(t, fx, { slug: "draf", status: "draft" });
  await expect(
    asMember.query(api.features.progress.queries.getLessonCompletion, { lessonId: draft })
  ).rejects.toThrow(/NOT_FOUND/);
  expect(
    await t
      .withIdentity(asUser(fx.instructorId))
      .query(api.features.progress.queries.getLessonCompletion, { lessonId: draft })
  ).toEqual({ isCompleted: false });
});

test("getCourseProgress: counts the courseLessons roster, and a shared materi counts once", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const a = await seedCourseWithLessons(t, fx, "published", 1, "kelas-a");
  const b = await seedCourseWithLessons(t, fx, "published", 1, "kelas-b");
  // One materi with NO legacy courseId, placed in both courses.
  const shared = await seedMateri(t, fx, { slug: "sub-agents" });
  await placeLesson(t, fx, a.courseId, shared, 2);
  await placeLesson(t, fx, b.courseId, shared, 2);
  await complete(t, { tenantId: fx.tenantId, userId: fx.memberId, lessonId: shared });

  const asMember = t.withIdentity(asUser(fx.memberId));
  for (const courseId of [a.courseId, b.courseId]) {
    const progress = await asMember.query(api.features.progress.queries.getCourseProgress, {
      courseId,
    });
    expect(progress).toMatchObject({ completedCount: 1, totalCount: 2, isComplete: false });
    expect(progress.completedLessonIds).toEqual([shared]);
  }
});
