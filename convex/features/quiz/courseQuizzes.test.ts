/// <reference types="vite/client" />
// listQuizzesForCourse — the course page's quiz index. Asserts the projection
// carries NO questions (the answer key must not ride along), that an empty
// course returns [], and the draft-course gate + authz-denied paths.
import { expect, test } from "vitest";
import { api } from "../../_generated/api";
import { asUser, seedCourse, seedQuiz, seedTenantFixture, setup } from "./test.helpers";

test("listQuizzesForCourse: titles only (no questions), empty course → [], draft gated", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const published = await seedCourse(t, fx, "published");
  const draft = await seedCourse(t, fx, "draft");
  const asMember = t.withIdentity(asUser(fx.memberId));

  expect(
    await asMember.query(api.features.quiz.taking.listQuizzesForCourse, {
      courseId: published.courseId,
    })
  ).toEqual([]);

  await seedQuiz(t, fx, published, 50, "Kuis Satu");
  await seedQuiz(t, fx, published, 70, "Kuis Dua");
  const rows = await asMember.query(api.features.quiz.taking.listQuizzesForCourse, {
    courseId: published.courseId,
  });
  expect(rows).toHaveLength(2);
  expect(rows.map((r) => r.title).sort()).toEqual(["Kuis Dua", "Kuis Satu"]);
  expect(Object.keys(rows[0]).sort()).toEqual([
    "_id",
    "passingScorePct",
    "questionCount",
    "title",
  ]);
  expect(rows[0].questionCount).toBe(2);

  // draft course: member NOT_FOUND, instructor sees it
  await seedQuiz(t, fx, draft, 50, "Kuis Draft");
  await expect(
    asMember.query(api.features.quiz.taking.listQuizzesForCourse, { courseId: draft.courseId })
  ).rejects.toThrow(/NOT_FOUND/);
  const asInstructor = await t
    .withIdentity(asUser(fx.instructorId))
    .query(api.features.quiz.taking.listQuizzesForCourse, { courseId: draft.courseId });
  expect(asInstructor).toHaveLength(1);
});

test("listQuizzesForCourse: anon NOT_AUTHENTICATED, outsider NOT_AUTHORIZED", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const c = await seedCourse(t, fx, "published");

  await expect(
    t.query(api.features.quiz.taking.listQuizzesForCourse, { courseId: c.courseId })
  ).rejects.toThrow(/NOT_AUTHENTICATED/);
  await expect(
    t
      .withIdentity(asUser(fx.outsiderId))
      .query(api.features.quiz.taking.listQuizzesForCourse, { courseId: c.courseId })
  ).rejects.toThrow(/NOT_AUTHORIZED/);
});
