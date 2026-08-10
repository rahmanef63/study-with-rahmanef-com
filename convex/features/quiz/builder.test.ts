/// <reference types="vite/client" />
// Builder mutations — authz-denied paths (P0), course ownership, question
// validation, and the delete-blocked-by-attempts invariant. A quiz belongs to a
// COURSE now; several quizzes per course are allowed (DECISIONS #37).
import { expect, test } from "vitest";
import { api } from "../../_generated/api";
import type { Id } from "../../_generated/dataModel";
import {
  asUser,
  seedCourse,
  seedQuiz,
  seedTenantFixture,
  setup,
  validQuizArgs,
} from "./test.helpers";

test("createQuiz: anon NOT_AUTHENTICATED, member NOT_AUTHORIZED, instructor creates", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const c = await seedCourse(t, fx, "draft");
  const args = validQuizArgs(c.courseId);

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
  // tenantId is DERIVED from the course, not the client; no legacy moduleId.
  expect(quiz?.tenantId).toBe(fx.tenantId);
  expect(quiz?.courseId).toBe(c.courseId);
  expect(quiz?.questions).toHaveLength(2);
  expect(quiz?.moduleId).toBeUndefined();
});

test("createQuiz: a course may carry several quizzes (the one-per-module rule is gone)", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const c = await seedCourse(t, fx, "draft");
  const asInstructor = t.withIdentity(asUser(fx.instructorId));

  await asInstructor.mutation(api.features.quiz.builder.createQuiz, validQuizArgs(c.courseId));
  await asInstructor.mutation(api.features.quiz.builder.createQuiz, {
    ...validQuizArgs(c.courseId),
    title: "Kuis Kedua",
  });

  const rows = await t.run(async (ctx) =>
    ctx.db
      .query("quizzes")
      .withIndex("by_course", (q) => q.eq("courseId", c.courseId))
      .collect()
  );
  expect(rows).toHaveLength(2);
});

test("createQuiz: invalid shapes are VALIDATION_FAILED", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const c = await seedCourse(t, fx, "draft");
  const asInstructor = t.withIdentity(asUser(fx.instructorId));
  const base = validQuizArgs(c.courseId);

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
  const c = await seedCourse(t, fx, "draft");
  const quizId = await seedQuiz(t, fx, c);

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
  const c = await seedCourse(t, fx, "published");
  const quizId = await seedQuiz(t, fx, c);
  const asInstructor = t.withIdentity(asUser(fx.instructorId));

  // no attempts yet → deletes; re-seed for the blocked case
  await asInstructor.mutation(api.features.quiz.builder.deleteQuiz, { quizId });
  expect(await t.run(async (ctx) => ctx.db.get(quizId))).toBeNull();

  const quiz2 = await seedQuiz(t, fx, c);
  await t
    .withIdentity(asUser(fx.memberId))
    .mutation(api.features.quiz.attempts.submitAttempt, { quizId: quiz2, answers: [0, 1] });
  await expect(
    asInstructor.mutation(api.features.quiz.builder.deleteQuiz, { quizId: quiz2 })
  ).rejects.toThrow(/VALIDATION_FAILED/);
  expect(await t.run(async (ctx) => ctx.db.get(quiz2))).not.toBeNull();
});
