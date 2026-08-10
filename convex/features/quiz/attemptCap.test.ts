/// <reference types="vite/client" />
// Attempt cap + answer-key reveal gate.
//
// The hole this closes: submitAttempt used to return correctIndex + explanation
// for EVERY question on the first submit, with no cap — so a member could send
// garbage once, read the whole key, and resubmit perfectly to mark the module
// lulus. Now the key only comes out when it can no longer buy a better score.
import { expect, test } from "vitest";
import { api } from "../../_generated/api";
import { asUser, seedCourse, seedQuiz, seedTenantFixture, setup } from "./test.helpers";
import { MAX_ATTEMPTS_PER_QUIZ } from "./attempts";

// Both wrong: question 0 answer is 0, question 1 answer is 1.
const WRONG = [2, 2];
const RIGHT = [0, 1];

async function fixture() {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const c = await seedCourse(t, fx, "published");
  const quizId = await seedQuiz(t, fx, c);
  return { t, fx, quizId };
}

test("failed attempt with tries left withholds the answer key but still scores", async () => {
  const { t, fx, quizId } = await fixture();

  const res = await t
    .withIdentity(asUser(fx.memberId))
    .mutation(api.features.quiz.attempts.submitAttempt, { quizId, answers: WRONG });

  expect(res.passed).toBe(false);
  expect(res.keyRevealed).toBe(false);
  expect(res.attemptsUsed).toBe(1);
  expect(res.attemptsAllowed).toBe(MAX_ATTEMPTS_PER_QUIZ);
  // Score feedback survives — only the key is withheld.
  for (const r of res.results) {
    expect(r.isCorrect).toBe(false);
    expect(r.correctIndex).toBeUndefined();
    expect(r.explanation).toBeUndefined();
  }
  expect(JSON.stringify(res)).not.toContain("Artificial Intelligence");
});

test("passing reveals the key", async () => {
  const { t, fx, quizId } = await fixture();

  const res = await t
    .withIdentity(asUser(fx.memberId))
    .mutation(api.features.quiz.attempts.submitAttempt, { quizId, answers: RIGHT });

  expect(res.passed).toBe(true);
  expect(res.keyRevealed).toBe(true);
  expect(res.results[0].correctIndex).toBe(0);
  expect(res.results[1].correctIndex).toBe(1);
});

test("the last allowed attempt reveals the key, and the next submit is RATE_LIMITED", async () => {
  const { t, fx, quizId } = await fixture();
  const as = t.withIdentity(asUser(fx.memberId));

  for (let i = 1; i < MAX_ATTEMPTS_PER_QUIZ; i++) {
    const res = await as.mutation(api.features.quiz.attempts.submitAttempt, {
      quizId,
      answers: WRONG,
    });
    expect(res.attemptsUsed).toBe(i);
    expect(res.keyRevealed).toBe(false);
  }

  // Attempt N of N — nothing left to buy, so the key comes out.
  const last = await as.mutation(api.features.quiz.attempts.submitAttempt, {
    quizId,
    answers: WRONG,
  });
  expect(last.attemptsUsed).toBe(MAX_ATTEMPTS_PER_QUIZ);
  expect(last.keyRevealed).toBe(true);

  // Cap holds: a perfect resubmit can no longer manufacture `passed`.
  await expect(
    as.mutation(api.features.quiz.attempts.submitAttempt, { quizId, answers: RIGHT })
  ).rejects.toThrow(/RATE_LIMITED/);
});

test("authz denied: anon NOT_AUTHENTICATED, outsider NOT_AUTHORIZED", async () => {
  const { t, fx, quizId } = await fixture();

  await expect(
    t.mutation(api.features.quiz.attempts.submitAttempt, { quizId, answers: RIGHT })
  ).rejects.toThrow(/NOT_AUTHENTICATED/);
  await expect(
    t
      .withIdentity(asUser(fx.outsiderId))
      .mutation(api.features.quiz.attempts.submitAttempt, { quizId, answers: RIGHT })
  ).rejects.toThrow(/NOT_AUTHORIZED/);
});
