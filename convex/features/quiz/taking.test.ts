/// <reference types="vite/client" />
// Taking surface — P0 answer-stripping shape assertion, draft-course
// invisibility, server-side grading (incl. the passed boundary), and
// own-attempts-only isolation.
import { expect, test } from "vitest";
import { api } from "../../_generated/api";
import { asUser, seedCourseModule, seedQuiz, seedTenantFixture, setup } from "./test.helpers";

test("getQuizForTaking: P0 — returned questions carry ONLY prompt+options (no answers)", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const cm = await seedCourseModule(t, fx, "published");
  await seedQuiz(t, fx, cm);

  const quiz = await t
    .withIdentity(asUser(fx.memberId))
    .query(api.features.quiz.taking.getQuizForTaking, { moduleId: cm.moduleId });

  expect(quiz).not.toBeNull();
  for (const q of quiz!.questions) {
    // Exact key set — no correctIndex, no explanation may ever appear.
    expect(Object.keys(q).sort()).toEqual(["options", "prompt"]);
    expect((q as Record<string, unknown>).correctIndex).toBeUndefined();
    expect((q as Record<string, unknown>).explanation).toBeUndefined();
  }
  // Serialized payload must not mention the answer fields at all.
  const serialized = JSON.stringify(quiz);
  expect(serialized).not.toContain("correctIndex");
  expect(serialized).not.toContain("explanation");
});

test("getQuizForTaking: anon NOT_AUTHENTICATED, outsider NOT_AUTHORIZED, null when no quiz", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const cm = await seedCourseModule(t, fx, "published");

  await expect(
    t.query(api.features.quiz.taking.getQuizForTaking, { moduleId: cm.moduleId })
  ).rejects.toThrow(/NOT_AUTHENTICATED/);
  await expect(
    t
      .withIdentity(asUser(fx.outsiderId))
      .query(api.features.quiz.taking.getQuizForTaking, { moduleId: cm.moduleId })
  ).rejects.toThrow(/NOT_AUTHORIZED/);

  // member, module has no quiz yet → null (not an error)
  const none = await t
    .withIdentity(asUser(fx.memberId))
    .query(api.features.quiz.taking.getQuizForTaking, { moduleId: cm.moduleId });
  expect(none).toBeNull();
});

test("getQuizForTaking: draft-course quiz is invisible to members, visible to instructor+", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const cm = await seedCourseModule(t, fx, "draft");
  await seedQuiz(t, fx, cm);

  await expect(
    t
      .withIdentity(asUser(fx.memberId))
      .query(api.features.quiz.taking.getQuizForTaking, { moduleId: cm.moduleId })
  ).rejects.toThrow(/NOT_FOUND/);

  const asInstructor = await t
    .withIdentity(asUser(fx.instructorId))
    .query(api.features.quiz.taking.getQuizForTaking, { moduleId: cm.moduleId });
  expect(asInstructor?.title).toBe("Kuis Modul 1");
});

test("submitAttempt: grades server-side; passed boundary is inclusive (>=)", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const cm = await seedCourseModule(t, fx, "published");
  // passing = 50; 2 questions → one correct = exactly 50%
  const quizId = await seedQuiz(t, fx, cm, 50);
  const asMember = t.withIdentity(asUser(fx.memberId));

  // both correct → 100, passed
  const full = await asMember.mutation(api.features.quiz.attempts.submitAttempt, {
    quizId,
    answers: [0, 1],
  });
  expect(full.scorePct).toBe(100);
  expect(full.passed).toBe(true);
  expect(full.correctCount).toBe(2);
  // result reveals answers/explanations only AFTER submit
  expect(full.results[0].correctIndex).toBe(0);
  expect(full.results[0].explanation).toContain("Artificial");

  // exactly one correct → 50 == passing → passed (boundary inclusive)
  const boundary = await asMember.mutation(api.features.quiz.attempts.submitAttempt, {
    quizId,
    answers: [0, 0],
  });
  expect(boundary.scorePct).toBe(50);
  expect(boundary.passed).toBe(true);

  // none correct → 0 → not passed
  const zero = await asMember.mutation(api.features.quiz.attempts.submitAttempt, {
    quizId,
    answers: [2, 2],
  });
  expect(zero.scorePct).toBe(0);
  expect(zero.passed).toBe(false);
});

test("submitAttempt: above-passing threshold that isn't a multiple still passes; wrong length rejected", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const cm = await seedCourseModule(t, fx, "published");
  const quizId = await seedQuiz(t, fx, cm, 60); // passing 60; 50% must FAIL
  const asMember = t.withIdentity(asUser(fx.memberId));

  const half = await asMember.mutation(api.features.quiz.attempts.submitAttempt, {
    quizId,
    answers: [0, 0],
  });
  expect(half.scorePct).toBe(50);
  expect(half.passed).toBe(false); // 50 < 60

  // wrong answer-array length → VALIDATION_FAILED
  await expect(
    asMember.mutation(api.features.quiz.attempts.submitAttempt, { quizId, answers: [0] })
  ).rejects.toThrow(/VALIDATION_FAILED/);
  // out-of-range answer index → VALIDATION_FAILED
  await expect(
    asMember.mutation(api.features.quiz.attempts.submitAttempt, { quizId, answers: [0, 9] })
  ).rejects.toThrow(/VALIDATION_FAILED/);
});

test("submitAttempt + listMyAttempts: outsider denied; a member sees only their OWN attempts", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const cm = await seedCourseModule(t, fx, "published");
  const quizId = await seedQuiz(t, fx, cm);

  await expect(
    t
      .withIdentity(asUser(fx.outsiderId))
      .mutation(api.features.quiz.attempts.submitAttempt, { quizId, answers: [0, 1] })
  ).rejects.toThrow(/NOT_AUTHORIZED/);

  await t
    .withIdentity(asUser(fx.memberId))
    .mutation(api.features.quiz.attempts.submitAttempt, { quizId, answers: [0, 1] });
  // instructor is also a different user — their own list stays empty
  await t
    .withIdentity(asUser(fx.instructorId))
    .mutation(api.features.quiz.attempts.submitAttempt, { quizId, answers: [2, 2] });

  const mine = await t
    .withIdentity(asUser(fx.memberId))
    .query(api.features.quiz.taking.listMyAttempts, { quizId });
  expect(mine).toHaveLength(1);
  expect(mine[0].scorePct).toBe(100);
});
