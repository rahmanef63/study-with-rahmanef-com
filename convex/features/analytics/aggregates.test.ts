/// <reference types="vite/client" />
// Aggregate CORRECTNESS on a seeded fixture + empty-course zeroes (DoD §5.2;
// assignment #17). Rows are inserted directly (test.helpers) so the read
// surface is exercised independently of other slices' mutations. Also asserts
// the no-PII guarantee: outputs never contain user ids or emails.
import { expect, test } from "vitest";
import { api } from "../../_generated/api";
import {
  asUser,
  insertAttempt,
  insertBadge,
  insertCompletion,
  seedCourseWithLessons,
  seedQuiz,
  seedTenantFixture,
  setup,
} from "./test.helpers";

test("getCourseAnalytics: empty course → zeroes everywhere (memberCount still counts)", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const { courseId } = await seedCourseWithLessons(t, fx, "draft", 0);

  const result = await t
    .withIdentity(asUser(fx.instructorId))
    .query(api.features.analytics.queries.getCourseAnalytics, { courseId });

  expect(result).toMatchObject({
    memberCount: 3, // owner + instructor + member (outsider has no row)
    courseCompletionCount: 0,
    totalLessons: 0,
  });
  expect(result.lessons).toEqual([]);
  expect(result.quizzes).toEqual([]);
});

test("getCourseAnalytics: per-lesson counts, badge count, and quiz stats are exact", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const c = await seedCourseWithLessons(t, fx, "published", 2);

  // member completes lesson 1+2 (badge earned); owner completes lesson 1 only.
  await insertCompletion(t, fx, c, fx.memberId, c.lessonIds[0]);
  await insertCompletion(t, fx, c, fx.memberId, c.lessonIds[1]);
  await insertCompletion(t, fx, c, fx.ownerId, c.lessonIds[0]);
  await insertBadge(t, fx, c.courseId, fx.memberId);

  // quiz: member fails, owner passes → 2 attempts, 1 pass, 50%.
  const quizId = await seedQuiz(t, fx, c);
  await insertAttempt(t, fx, quizId, fx.memberId, false);
  await insertAttempt(t, fx, quizId, fx.ownerId, true);

  const result = await t
    .withIdentity(asUser(fx.instructorId))
    .query(api.features.analytics.queries.getCourseAnalytics, { courseId: c.courseId });

  expect(result.memberCount).toBe(3);
  expect(result.courseCompletionCount).toBe(1);
  expect(result.totalLessons).toBe(2);
  expect(result.lessons.map((l) => ({ id: l.lessonId, n: l.completedCount }))).toEqual([
    { id: c.lessonIds[0], n: 2 },
    { id: c.lessonIds[1], n: 1 },
  ]);
  expect(result.lessons[0]).toMatchObject({ title: "Lesson 1", moduleTitle: "Modul 1" });
  expect(result.quizzes).toHaveLength(1);
  expect(result.quizzes[0]).toMatchObject({
    quizId,
    quizTitle: "Kuis Modul 1",
    attemptCount: 2,
    passCount: 1,
    passRatePct: 50,
  });
});

test("getCourseAnalytics: no PII — output carries no user ids or emails", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const c = await seedCourseWithLessons(t, fx, "published", 1);
  await insertCompletion(t, fx, c, fx.memberId, c.lessonIds[0]);
  await insertBadge(t, fx, c.courseId, fx.memberId);

  const result = await t
    .withIdentity(asUser(fx.instructorId))
    .query(api.features.analytics.queries.getCourseAnalytics, { courseId: c.courseId });

  const serialized = JSON.stringify(result);
  expect(serialized).not.toContain(fx.memberId);
  expect(serialized).not.toContain(fx.ownerId);
  expect(serialized).not.toContain("@"); // no emails anywhere
});

test("listCourseSummaries: badges bucket per course; other tenant's badges never leak in", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const other = await seedTenantFixture(t, "komunitas-lain");
  const c1 = await seedCourseWithLessons(t, fx, "published", 1, "kelas-satu");
  const c2 = await seedCourseWithLessons(t, fx, "draft", 1, "kelas-dua");
  const cOther = await seedCourseWithLessons(t, other, "published", 1, "kelas-lain");

  await insertBadge(t, fx, c1.courseId, fx.memberId);
  await insertBadge(t, fx, c1.courseId, fx.ownerId);
  // fx.member also earned a badge in the OTHER tenant — must not count here.
  await insertBadge(t, other, cOther.courseId, fx.memberId);

  const summaries = await t
    .withIdentity(asUser(fx.instructorId))
    .query(api.features.analytics.queries.listCourseSummaries, { tenantId: fx.tenantId });

  expect(summaries).toHaveLength(2);
  const bySlug = new Map(summaries.map((s) => [s.slug, s]));
  expect(bySlug.get("kelas-satu")).toMatchObject({ completionCount: 2, memberCount: 3 });
  expect(bySlug.get("kelas-dua")).toMatchObject({ completionCount: 0, memberCount: 3 });
  expect(summaries.some((s) => s.courseId === cOther.courseId)).toBe(false);
});
