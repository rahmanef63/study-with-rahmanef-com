/// <reference types="vite/client" />
// Member/public read surface on the MATERI model. The P0 paths: draft COURSES
// invisible to members in the query, draft MATERI invisible to members in the
// query, materi content member-only, authz-denied for anon + non-member.
// The four visibility cases from the migration contract are covered end to end:
// anon / member+published / member+draft / instructor+draft.
import { expect, test } from "vitest";
import { api } from "../../_generated/api";
import { asUser, placeMateri, seedCourse, seedMateri, seedTenantFixture, setup } from "./test.helpers";

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

test("getOverview: published course is public, materi list is FLAT, ordered and projected", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const { courseId, lessonId } = await seedCourse(t, fx, "published");
  const secondId = await seedMateri(t, fx, { title: "Materi 2", slug: "materi-2" });
  await placeMateri(t, fx, courseId, secondId, 2);

  const overview = await t.query(api.features.courses.queries.getOverview, {
    tenantId: fx.tenantId,
    courseSlug: "kelas-published",
  }); // anonymous caller — etalase
  expect(overview.course.title).toBe("Kelas published");
  expect(overview.viewerRole).toBeNull();
  expect(overview.lessonCount).toBe(2);
  expect(overview.lessons.map((l) => l._id)).toEqual([lessonId, secondId]); // courseLessons.order
  expect(overview).not.toHaveProperty("modules");

  const lesson = overview.lessons[0];
  expect(Object.keys(lesson).sort()).toEqual(["_id", "hasVideo", "order", "slug", "title"].sort());
  expect(lesson.hasVideo).toBe(true);
  expect(lesson).not.toHaveProperty("contentMd");
  expect(lesson).not.toHaveProperty("youtubeVideoId");
  expect(lesson).not.toHaveProperty("links");
});

test("getOverview: placement order wins over insertion order", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const { courseId, lessonId } = await seedCourse(t, fx, "published");
  const secondId = await seedMateri(t, fx, { title: "Materi 2", slug: "materi-2" });
  await placeMateri(t, fx, courseId, secondId, 0); // placed BEFORE the fixture materi

  const overview = await t.query(api.features.courses.queries.getOverview, {
    tenantId: fx.tenantId,
    courseSlug: "kelas-published",
  });
  expect(overview.lessons.map((l) => l._id)).toEqual([secondId, lessonId]);
});

test("getOverview: DRAFT materi hidden from anon + member, listed for instructor+", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const { courseId } = await seedCourse(t, fx, "published");
  const draftId = await seedMateri(t, fx, {
    title: "Materi Draft",
    slug: "materi-draft",
    status: "draft",
  });
  await placeMateri(t, fx, courseId, draftId, 2);
  const args = { tenantId: fx.tenantId, courseSlug: "kelas-published" };

  const anon = await t.query(api.features.courses.queries.getOverview, args);
  expect(anon.lessonCount).toBe(1);
  const member = await t
    .withIdentity(asUser(fx.memberId))
    .query(api.features.courses.queries.getOverview, args);
  expect(member.lessons.map((l) => l._id)).not.toContain(draftId);

  const instructor = await t
    .withIdentity(asUser(fx.instructorId))
    .query(api.features.courses.queries.getOverview, args);
  expect(instructor.lessonCount).toBe(2);
  expect(instructor.lessons.map((l) => l._id)).toContain(draftId);
});

test("getOverview: draft COURSE is NOT_FOUND for anon and member, visible to instructor+", async () => {
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
  expect(lesson.slug).toBe("materi-1-kelas-published");
});

test("getLesson: DRAFT materi is NOT_FOUND for member, readable by instructor+", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const { courseId } = await seedCourse(t, fx, "published");
  const draftId = await seedMateri(t, fx, {
    title: "Materi Draft",
    slug: "materi-draft",
    status: "draft",
  });
  await placeMateri(t, fx, courseId, draftId, 2);

  await expect(
    t.withIdentity(asUser(fx.memberId)).query(api.features.courses.queries.getLesson, {
      lessonId: draftId,
    })
  ).rejects.toThrow(/NOT_FOUND/);

  const lesson = await t
    .withIdentity(asUser(fx.instructorId))
    .query(api.features.courses.queries.getLesson, { lessonId: draftId });
  expect(lesson.title).toBe("Materi Draft");
  expect(lesson.status).toBe("draft");
});

test("getLesson: a materi with no `status` column (pre-migration row) reads as published", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const legacyId = await seedMateri(t, fx, {
    title: "Materi Lawas",
    slug: "materi-lawas",
    omitStatus: true,
  });

  const lesson = await t
    .withIdentity(asUser(fx.memberId))
    .query(api.features.courses.queries.getLesson, { lessonId: legacyId });
  expect(lesson.status).toBe("published");
  expect(lesson.courseId).toBeNull(); // placed in no course at all
});

test("getLesson: a DRAFT course gates its page, NOT the materi it teaches", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const { lessonId } = await seedCourse(t, fx, "draft");

  // The materi itself is published tenant content — a member reads it…
  const lesson = await t
    .withIdentity(asUser(fx.memberId))
    .query(api.features.courses.queries.getLesson, { lessonId });
  expect(lesson.contentMd).toContain("Materi pertama");
  // …but the unpublished course is not leaked as reading context.
  expect(lesson.courseId).toBeNull();
  expect(lesson.courseSlug).toBeNull();

  const asInstructor = await t
    .withIdentity(asUser(fx.instructorId))
    .query(api.features.courses.queries.getLesson, { lessonId });
  expect(asInstructor.courseSlug).toBe("kelas-draft");
});

test("getLesson: prev/next walk courseLessons.order of the requested course", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const { courseId, lessonId } = await seedCourse(t, fx, "published");
  const secondId = await seedMateri(t, fx, { title: "Materi 2", slug: "materi-2" });
  await placeMateri(t, fx, courseId, secondId, 2);
  const asMember = t.withIdentity(asUser(fx.memberId));

  const first = await asMember.query(api.features.courses.queries.getLesson, {
    lessonId,
    courseId,
  });
  expect(first.prevLessonId).toBeNull();
  expect(first.nextLessonId).toBe(secondId);

  const second = await asMember.query(api.features.courses.queries.getLesson, {
    lessonId: secondId,
    courseId,
  });
  expect(second.prevLessonId).toBe(lessonId);
  expect(second.nextLessonId).toBeNull();
});

test("getLesson: prev/next skip draft materi so a member never gets a dead link", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const { courseId, lessonId } = await seedCourse(t, fx, "published");
  const draftId = await seedMateri(t, fx, { title: "Draft", slug: "draft", status: "draft" });
  const thirdId = await seedMateri(t, fx, { title: "Materi 3", slug: "materi-3" });
  await placeMateri(t, fx, courseId, draftId, 2);
  await placeMateri(t, fx, courseId, thirdId, 3);

  const member = await t
    .withIdentity(asUser(fx.memberId))
    .query(api.features.courses.queries.getLesson, { lessonId, courseId });
  expect(member.nextLessonId).toBe(thirdId); // the draft is stepped over

  const instructor = await t
    .withIdentity(asUser(fx.instructorId))
    .query(api.features.courses.queries.getLesson, { lessonId, courseId });
  expect(instructor.nextLessonId).toBe(draftId);
});

test("getLesson: the same materi reads with per-course prev/next in each course", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const a = await seedCourse(t, fx, "published", "kelas-a");
  const b = await seedCourse(t, fx, "published", "kelas-b");
  const shared = await seedMateri(t, fx, { title: "Materi Bersama", slug: "materi-bersama" });
  await placeMateri(t, fx, a.courseId, shared, 2);
  await placeMateri(t, fx, b.courseId, shared, 0); // first in kelas-b
  const asMember = t.withIdentity(asUser(fx.memberId));

  const inA = await asMember.query(api.features.courses.queries.getLesson, {
    lessonId: shared,
    courseId: a.courseId,
  });
  expect(inA.courseSlug).toBe("kelas-a");
  expect(inA.prevLessonId).toBe(a.lessonId);

  const inB = await asMember.query(api.features.courses.queries.getLesson, {
    lessonId: shared,
    courseId: b.courseId,
  });
  expect(inB.courseSlug).toBe("kelas-b");
  expect(inB.prevLessonId).toBeNull();
  expect(inB.nextLessonId).toBe(b.lessonId);
});
