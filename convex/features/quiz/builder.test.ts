/// <reference types="vite/client" />
// Builder mutations — authz-denied paths (P0), one-quiz-per-module, question
// validation, and the delete-blocked-by-attempts invariant.
import { expect, test } from "vitest";
import { api } from "../../_generated/api";
import type { Id } from "../../_generated/dataModel";
import {
  asUser,
  seedCourseModule,
  seedQuiz,
  seedTenantFixture,
  setup,
  validQuizArgs,
} from "./test.helpers";

test("createQuiz: anon NOT_AUTHENTICATED, member NOT_AUTHORIZED, instructor creates", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const cm = await seedCourseModule(t, fx, "draft");
  const args = validQuizArgs(cm.moduleId);

  await expect(
    t.mutation(api.features.quiz.builder.createQuiz, args)
  ).rejects.toThrow(/NOT_AUTHENTICATED/);
  await expect(
    t.withIdentity(asUser(fx.memberId)).mutation(api.features.quiz.builder.createQuiz, args)
  ).rejects.toThrow(/NOT_AUTHORIZED/);
  await expect(
    t.withIdentity(asUser(fx.outsiderId)).mutation(api.features.quiz.builder.createQuiz, args)
  ).rejects.toThrow(/NOT_AUTHORIZED/);

  const quizId = (await t
    .withIdentity(asUser(fx.instructorId))
    .mutation(api.features.quiz.builder.createQuiz, args)) as Id<"quizzes">;
  const quiz = await t.run(async (ctx) => ctx.db.get(quizId));
  // tenantId/courseId are DERIVED from the module, not the client.
  expect(quiz?.tenantId).toBe(fx.tenantId);
  expect(quiz?.courseId).toBe(cm.courseId);
  expect(quiz?.questions).toHaveLength(2);
});

test("createQuiz: second quiz on the same module is VALIDATION_FAILED (one per module)", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const cm = await seedCourseModule(t, fx, "draft");
  const asInstructor = t.withIdentity(asUser(fx.instructorId));

  await asInstructor.mutation(api.features.quiz.builder.createQuiz, validQuizArgs(cm.moduleId));
  await expect(
    asInstructor.mutation(api.features.quiz.builder.createQuiz, validQuizArgs(cm.moduleId))
  ).rejects.toThrow(/VALIDATION_FAILED/);
});

test("createQuiz: invalid shapes are VALIDATION_FAILED", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const cm = await seedCourseModule(t, fx, "draft");
  const asInstructor = t.withIdentity(asUser(fx.instructorId));
  const base = validQuizArgs(cm.moduleId);

  // correctIndex out of range
  await expect(
    asInstructor.mutation(api.features.quiz.builder.createQuiz, {
      ...base,
      questions: [{ prompt: "Soal cukup panjang?", options: ["a", "b"], correctIndex: 5 }],
    })
  ).rejects.toThrow(/VALIDATION_FAILED/);

  // only one option (needs 2–6)
  await expect(
    asInstructor.mutation(api.features.quiz.builder.createQuiz, {
      ...base,
      questions: [{ prompt: "Soal cukup panjang?", options: ["cuma satu"], correctIndex: 0 }],
    })
  ).rejects.toThrow(/VALIDATION_FAILED/);

  // passingScorePct out of 0–100
  await expect(
    asInstructor.mutation(api.features.quiz.builder.createQuiz, { ...base, passingScorePct: 150 })
  ).rejects.toThrow(/VALIDATION_FAILED/);

  // zero questions
  await expect(
    asInstructor.mutation(api.features.quiz.builder.createQuiz, { ...base, questions: [] })
  ).rejects.toThrow(/VALIDATION_FAILED/);
});

test("updateQuiz: member denied; instructor patches; empty patch fails", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const cm = await seedCourseModule(t, fx, "draft");
  const quizId = await seedQuiz(t, fx, cm);

  await expect(
    t
      .withIdentity(asUser(fx.memberId))
      .mutation(api.features.quiz.builder.updateQuiz, { quizId, title: "Diretas Member" })
  ).rejects.toThrow(/NOT_AUTHORIZED/);

  const asInstructor = t.withIdentity(asUser(fx.instructorId));
  await asInstructor.mutation(api.features.quiz.builder.updateQuiz, {
    quizId,
    title: "Judul Baru",
    passingScorePct: 80,
  });
  const quiz = await t.run(async (ctx) => ctx.db.get(quizId));
  expect(quiz?.title).toBe("Judul Baru");
  expect(quiz?.passingScorePct).toBe(80);

  await expect(
    asInstructor.mutation(api.features.quiz.builder.updateQuiz, { quizId })
  ).rejects.toThrow(/VALIDATION_FAILED/);
});

test("deleteQuiz: blocked once an attempt exists; deletes when none", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const cm = await seedCourseModule(t, fx, "published");
  const quizId = await seedQuiz(t, fx, cm);
  const asInstructor = t.withIdentity(asUser(fx.instructorId));

  // no attempts yet → deletes; re-seed for the blocked case
  await asInstructor.mutation(api.features.quiz.builder.deleteQuiz, { quizId });
  expect(await t.run(async (ctx) => ctx.db.get(quizId))).toBeNull();

  const quiz2 = await seedQuiz(t, fx, cm);
  await t
    .withIdentity(asUser(fx.memberId))
    .mutation(api.features.quiz.attempts.submitAttempt, { quizId: quiz2, answers: [0, 1] });
  await expect(
    asInstructor.mutation(api.features.quiz.builder.deleteQuiz, { quizId: quiz2 })
  ).rejects.toThrow(/VALIDATION_FAILED/);
  expect(await t.run(async (ctx) => ctx.db.get(quiz2))).not.toBeNull();
});
