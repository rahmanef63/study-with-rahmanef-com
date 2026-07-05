/// <reference types="vite/client" />
// Lesson mutations — the P0 youtubeVideoId gate (11-char ID, never a URL),
// authz-denied paths, optional-field clearing, reorder guard, and the
// completion-protects-deletion invariant (docs/DATA-MODEL.md).
import { expect, test } from "vitest";
import { api } from "../../_generated/api";
import type { Id } from "../../_generated/dataModel";
import { asUser, seedCourse, seedTenantFixture, setup } from "./test.helpers";

const baseLesson = { title: "Lesson Baru", contentMd: "Materi baru", links: [] };

test("createLesson: full YouTube URLs are rejected, a bare 11-char ID is accepted", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const { moduleId } = await seedCourse(t, fx, "draft");
  const asInstructor = t.withIdentity(asUser(fx.instructorId));

  for (const url of [
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "https://youtu.be/dQw4w9WgXcQ",
    "youtube.com/embed/dQw4w9WgXcQ",
    "dQw4w9WgXc", // 10 chars
    "dQw4w9WgXcQQ", // 12 chars
  ]) {
    await expect(
      asInstructor.mutation(api.features.courses.lessons.createLesson, {
        moduleId,
        ...baseLesson,
        youtubeVideoId: url,
      })
    ).rejects.toThrow(/VALIDATION_FAILED/);
  }

  const lessonId = (await asInstructor.mutation(api.features.courses.lessons.createLesson, {
    moduleId,
    ...baseLesson,
    youtubeVideoId: "dQw4w9WgXcQ",
  })) as Id<"lessons">;
  const lesson = await t.run(async (ctx) => ctx.db.get(lessonId));
  expect(lesson?.youtubeVideoId).toBe("dQw4w9WgXcQ");
  expect(lesson?.order).toBe(2); // appended after the fixture lesson
});

test("createLesson: anon NOT_AUTHENTICATED, member NOT_AUTHORIZED, video-less lesson ok", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const { moduleId } = await seedCourse(t, fx, "draft");

  await expect(
    t.mutation(api.features.courses.lessons.createLesson, { moduleId, ...baseLesson })
  ).rejects.toThrow(/NOT_AUTHENTICATED/);
  await expect(
    t
      .withIdentity(asUser(fx.memberId))
      .mutation(api.features.courses.lessons.createLesson, { moduleId, ...baseLesson })
  ).rejects.toThrow(/NOT_AUTHORIZED/);

  const lessonId = (await t
    .withIdentity(asUser(fx.ownerId)) // owner passes the instructor gate
    .mutation(api.features.courses.lessons.createLesson, { moduleId, ...baseLesson })) as Id<"lessons">;
  const lesson = await t.run(async (ctx) => ctx.db.get(lessonId));
  expect(lesson?.youtubeVideoId).toBeUndefined();
});

test("updateLesson: null clears the video, invalid link protocol is rejected", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const { lessonId } = await seedCourse(t, fx, "draft");
  const asInstructor = t.withIdentity(asUser(fx.instructorId));

  await asInstructor.mutation(api.features.courses.lessons.updateLesson, {
    lessonId,
    youtubeVideoId: null,
  });
  const cleared = await t.run(async (ctx) => ctx.db.get(lessonId));
  expect(cleared?.youtubeVideoId).toBeUndefined();

  await expect(
    asInstructor.mutation(api.features.courses.lessons.updateLesson, {
      lessonId,
      links: [{ label: "FTP jadul", url: "ftp://example.com/file" }],
    })
  ).rejects.toThrow(/VALIDATION_FAILED/);
});

test("reorderLessons: rejects ids from another module, applies new order", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const { moduleId, lessonId } = await seedCourse(t, fx, "draft");
  const asInstructor = t.withIdentity(asUser(fx.instructorId));
  const secondId = (await asInstructor.mutation(api.features.courses.lessons.createLesson, {
    moduleId,
    ...baseLesson,
  })) as Id<"lessons">;

  await expect(
    asInstructor.mutation(api.features.courses.lessons.reorderLessons, {
      moduleId,
      orderedLessonIds: [secondId, secondId],
    })
  ).rejects.toThrow(/VALIDATION_FAILED/);

  await asInstructor.mutation(api.features.courses.lessons.reorderLessons, {
    moduleId,
    orderedLessonIds: [secondId, lessonId],
  });
  const first = await t.run(async (ctx) => ctx.db.get(secondId));
  expect(first?.order).toBe(1);
});

test("deleteLesson: blocked once a member has completed it, allowed otherwise", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const { courseId, lessonId } = await seedCourse(t, fx, "published");
  const asInstructor = t.withIdentity(asUser(fx.instructorId));

  await t.run(async (ctx) => {
    await ctx.db.insert("lessonCompletions", {
      tenantId: fx.tenantId,
      userId: fx.memberId,
      courseId,
      lessonId,
    });
  });
  await expect(
    asInstructor.mutation(api.features.courses.lessons.deleteLesson, { lessonId })
  ).rejects.toThrow(/VALIDATION_FAILED/);

  await t.run(async (ctx) => {
    const completions = await ctx.db.query("lessonCompletions").collect();
    for (const completion of completions) await ctx.db.delete(completion._id);
  });
  await asInstructor.mutation(api.features.courses.lessons.deleteLesson, { lessonId });
  const gone = await t.run(async (ctx) => ctx.db.get(lessonId));
  expect(gone).toBeNull();
});

test("getLessonForManage: member denied, instructor reads draft content for the editor", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const { lessonId } = await seedCourse(t, fx, "draft");

  await expect(
    t
      .withIdentity(asUser(fx.memberId))
      .query(api.features.courses.manage.getLessonForManage, { lessonId })
  ).rejects.toThrow(/NOT_AUTHORIZED/);

  const lesson = await t
    .withIdentity(asUser(fx.instructorId))
    .query(api.features.courses.manage.getLessonForManage, { lessonId });
  expect(lesson.contentMd).toContain("Materi pertama");
});
