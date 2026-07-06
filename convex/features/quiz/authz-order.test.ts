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
import { asUser, seedCourseModule, seedQuiz, seedTenantFixture, setup } from "./test.helpers";

async function danglingModule() {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const cm = await seedCourseModule(t, fx, "published", "kelas-dangling");
  await t.run(async (ctx) => {
    await ctx.db.delete(cm.moduleId);
    await ctx.db.delete(cm.courseId);
  });
  return { t, fx, ...cm };
}

async function danglingQuiz() {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const cm = await seedCourseModule(t, fx, "published", "kelas-dangling-quiz");
  const quizId = await seedQuiz(t, fx, cm);
  await t.run(async (ctx) => {
    await ctx.db.delete(quizId);
    await ctx.db.delete(cm.moduleId);
    await ctx.db.delete(cm.courseId);
  });
  return { t, fx, quizId, ...cm };
}

test("getForManage: anonymous + dangling moduleId → NOT_AUTHENTICATED (never NOT_FOUND)", async () => {
  const { t, moduleId } = await danglingModule();
  await expect(
    t.query(api.features.quiz.manage.getForManage, { moduleId })
  ).rejects.toThrow(/NOT_AUTHENTICATED/);
});

test("getQuizForTaking: anonymous + dangling moduleId → NOT_AUTHENTICATED", async () => {
  const { t, moduleId } = await danglingModule();
  await expect(
    t.query(api.features.quiz.taking.getQuizForTaking, { moduleId })
  ).rejects.toThrow(/NOT_AUTHENTICATED/);
});

test("createQuiz: anonymous + dangling moduleId → NOT_AUTHENTICATED", async () => {
  const { t, moduleId } = await danglingModule();
  await expect(
    t.mutation(api.features.quiz.builder.createQuiz, {
      moduleId,
      title: "Kuis",
      passingScorePct: 50,
      questions: [{ prompt: "Soal?", options: ["a", "b"], correctIndex: 0 }],
    })
  ).rejects.toThrow(/NOT_AUTHENTICATED/);
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
