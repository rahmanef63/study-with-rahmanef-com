/// <reference types="vite/client" />
// Authz-ORDER regression specs (pattern: courses/authz-order.test.ts).
//
// Discriminator = a DANGLING id (seed → delete → call as anonymous). If a
// handler read the row before authenticating, a deleted id would resolve to
// null → NOT_FOUND (an existence oracle for anonymous callers). Because
// requireUser runs FIRST, anonymous callers get NOT_AUTHENTICATED before any
// DB read — these specs FAIL on read-first code and PASS on the fixed code.
import { expect, test } from "vitest";
import { api } from "../../_generated/api";
import { asUser, seedCourse, seedQuiz, seedTenantFixture, setup, validQuizArgs } from "./test.helpers";

async function danglingCourse() {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const c = await seedCourse(t, fx, "published", "kelas-dangling");
  await t.run(async (ctx) => {
    await ctx.db.delete(c.courseId);
  });
  return { t, fx, ...c };
}

async function danglingQuiz() {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const c = await seedCourse(t, fx, "published", "kelas-dangling-quiz");
  const quizId = await seedQuiz(t, fx, c);
  await t.run(async (ctx) => {
    await ctx.db.delete(quizId);
    await ctx.db.delete(c.courseId);
  });
  return { t, fx, quizId, ...c };
}

test("getForManage: anonymous + dangling quizId → NOT_AUTHENTICATED (never NOT_FOUND)", async () => {
  const { t, quizId } = await danglingQuiz();
  await expect(
    t.query(api.features.quiz.manage.getForManage, { quizId })
  ).rejects.toThrow(/NOT_AUTHENTICATED/);
});

test("getQuizForTaking: anonymous + dangling quizId → NOT_AUTHENTICATED", async () => {
  const { t, quizId } = await danglingQuiz();
  await expect(
    t.query(api.features.quiz.taking.getQuizForTaking, { quizId })
  ).rejects.toThrow(/NOT_AUTHENTICATED/);
});

test("listQuizzesForCourse: anonymous + dangling courseId → NOT_AUTHENTICATED", async () => {
  const { t, courseId } = await danglingCourse();
  await expect(
    t.query(api.features.quiz.taking.listQuizzesForCourse, { courseId })
  ).rejects.toThrow(/NOT_AUTHENTICATED/);
});

test("createQuiz: anonymous + dangling courseId → NOT_AUTHENTICATED", async () => {
  const { t, courseId } = await danglingCourse();
  await expect(
    t.mutation(api.features.quiz.builder.createQuiz, validQuizArgs(courseId))
  ).rejects.toThrow(/NOT_AUTHENTICATED/);
});

test("createQuiz: a member of the tenant on a dangling course → NOT_FOUND, never a write", async () => {
  const { t, fx, courseId } = await danglingCourse();
  await expect(
    t
      .withIdentity(asUser(fx.instructorId))
      .mutation(api.features.quiz.builder.createQuiz, validQuizArgs(courseId))
  ).rejects.toThrow(/NOT_FOUND/);
});

test("updateQuiz: anonymous + dangling quizId → NOT_AUTHENTICATED", async () => {
  const { t, quizId } = await danglingQuiz();
  await expect(
    t.mutation(api.features.quiz.builder.updateQuiz, { quizId, title: "Baru" })
  ).rejects.toThrow(/NOT_AUTHENTICATED/);
});

test("deleteQuiz: anonymous + dangling quizId → NOT_AUTHENTICATED", async () => {
  const { t, quizId } = await danglingQuiz();
  await expect(
    t.mutation(api.features.quiz.builder.deleteQuiz, { quizId })
  ).rejects.toThrow(/NOT_AUTHENTICATED/);
});

test("submitAttempt: anonymous + dangling quizId → NOT_AUTHENTICATED", async () => {
  const { t, quizId } = await danglingQuiz();
  await expect(
    t.mutation(api.features.quiz.attempts.submitAttempt, { quizId, answers: [0, 1] })
  ).rejects.toThrow(/NOT_AUTHENTICATED/);
});

test("listMyAttempts: anonymous + dangling quizId → NOT_AUTHENTICATED", async () => {
  const { t, quizId } = await danglingQuiz();
  await expect(
    t.query(api.features.quiz.taking.listMyAttempts, { quizId })
  ).rejects.toThrow(/NOT_AUTHENTICATED/);
});
