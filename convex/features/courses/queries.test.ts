/// <reference types="vite/client" />
// Member/public read surface — the P0 paths from docs/AGENT-PROMPTS.md gamma:
// drafts invisible to members IN THE QUERY, lesson content member-only,
// authz-denied for anon + non-member callers.
import { expect, test } from "vitest";
import { api } from "../../_generated/api";
import { asUser, seedCourse, seedTenantFixture, setup } from "./test.helpers";

test("listPublished returns published courses only — drafts structurally excluded", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  await seedCourse(t, fx, "draft");
  await seedCourse(t, fx, "published");
  await seedCourse(t, fx, "archived");

  const cards = await t.query(api.features.courses.queries.listPublished, {
    tenantId: fx.tenantId,
  });
  expect(cards).toHaveLength(1);
  expect(cards[0].slug).toBe("kelas-published");
  // Projected card shape — no status/createdBy leak on the public surface.
  expect(Object.keys(cards[0]).sort()).toEqual(
    ["_id", "coverImageUrl", "description", "slug", "title"].sort()
  );
});

test("getOverview: published course is public, syllabus is projected (no content fields)", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  await seedCourse(t, fx, "published");

  const overview = await t.query(api.features.courses.queries.getOverview, {
    tenantId: fx.tenantId,
    courseSlug: "kelas-published",
  }); // anonymous caller — etalase
  expect(overview.course.title).toBe("Kelas published");
  expect(overview.viewerRole).toBeNull();
  expect(overview.modules).toHaveLength(1);
  const lesson = overview.modules[0].lessons[0];
  expect(lesson.hasVideo).toBe(true);
  expect(lesson).not.toHaveProperty("contentMd");
  expect(lesson).not.toHaveProperty("youtubeVideoId");
  expect(lesson).not.toHaveProperty("links");
});

test("getOverview: draft is NOT_FOUND for anon and member, visible to instructor+", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  await seedCourse(t, fx, "draft");
  const args = { tenantId: fx.tenantId, courseSlug: "kelas-draft" };

  await expect(t.query(api.features.courses.queries.getOverview, args)).rejects.toThrow(
    /NOT_FOUND/
  );
  await expect(
    t.withIdentity(asUser(fx.memberId)).query(api.features.courses.queries.getOverview, args)
  ).rejects.toThrow(/NOT_FOUND/);

  const asInstructor = await t
    .withIdentity(asUser(fx.instructorId))
    .query(api.features.courses.queries.getOverview, args);
  expect(asInstructor.course.status).toBe("draft");
  const asOwner = await t
    .withIdentity(asUser(fx.ownerId))
    .query(api.features.courses.queries.getOverview, args);
  expect(asOwner.viewerRole).toBe("owner");
});

test("getLesson: anon NOT_AUTHENTICATED, non-member NOT_AUTHORIZED, member gets full content", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const { lessonId } = await seedCourse(t, fx, "published");

  await expect(
    t.query(api.features.courses.queries.getLesson, { lessonId })
  ).rejects.toThrow(/NOT_AUTHENTICATED/);
  await expect(
    t.withIdentity(asUser(fx.outsiderId)).query(api.features.courses.queries.getLesson, {
      lessonId,
    })
  ).rejects.toThrow(/NOT_AUTHORIZED/);

  const lesson = await t
    .withIdentity(asUser(fx.memberId))
    .query(api.features.courses.queries.getLesson, { lessonId });
  expect(lesson.contentMd).toContain("Materi pertama");
  expect(lesson.youtubeVideoId).toBe("dQw4w9WgXcQ");
  expect(lesson.links).toHaveLength(1);
  expect(lesson.courseSlug).toBe("kelas-published");
});

test("getLesson: lesson of a DRAFT course is NOT_FOUND for member, readable by instructor", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const { lessonId } = await seedCourse(t, fx, "draft");

  await expect(
    t.withIdentity(asUser(fx.memberId)).query(api.features.courses.queries.getLesson, {
      lessonId,
    })
  ).rejects.toThrow(/NOT_FOUND/);

  const lesson = await t
    .withIdentity(asUser(fx.instructorId))
    .query(api.features.courses.queries.getLesson, { lessonId });
  expect(lesson.title).toBe("Lesson 1");
});

test("getLesson: prev/next navigation follows lesson order within the module", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const { courseId, moduleId, lessonId } = await seedCourse(t, fx, "published");
  const secondId = await t.run(async (ctx) =>
    ctx.db.insert("lessons", {
      tenantId: fx.tenantId,
      courseId,
      moduleId,
      title: "Lesson 2",
      contentMd: "Materi kedua",
      links: [],
      order: 2,
    })
  );

  const first = await t
    .withIdentity(asUser(fx.memberId))
    .query(api.features.courses.queries.getLesson, { lessonId });
  expect(first.prevLessonId).toBeNull();
  expect(first.nextLessonId).toBe(secondId);

  const second = await t
    .withIdentity(asUser(fx.memberId))
    .query(api.features.courses.queries.getLesson, { lessonId: secondId });
  expect(second.prevLessonId).toBe(lessonId);
  expect(second.nextLessonId).toBeNull();
});
