// Pure grading unit tests — rounding, boundary, and out-of-range answers.
import { describe, expect, test } from "vitest";
import { didPass, gradeAttempt } from "./grade";

const q = (correctIndex: number) => ({ correctIndex });

describe("gradeAttempt", () => {
  test("all correct → 100%", () => {
    expect(gradeAttempt([q(0), q(1)], [0, 1])).toEqual({ correctCount: 2, scorePct: 100 });
  });

  test("half correct → 50%", () => {
    expect(gradeAttempt([q(0), q(1)], [0, 0])).toEqual({ correctCount: 1, scorePct: 50 });
  });

  test("rounds to nearest integer (1 of 3 → 33)", () => {
    expect(gradeAttempt([q(0), q(0), q(0)], [0, 1, 1]).scorePct).toBe(33);
  });

  test("rounds 2 of 3 → 67", () => {
    expect(gradeAttempt([q(0), q(0), q(0)], [0, 0, 1]).scorePct).toBe(67);
  });

  test("out-of-range / skip sentinel answer counts as wrong, never throws", () => {
    expect(gradeAttempt([q(0), q(1)], [-1, 9])).toEqual({ correctCount: 0, scorePct: 0 });
  });
});

describe("didPass", () => {
  test("boundary is inclusive: score == passing → passed", () => {
    expect(didPass(50, 50)).toBe(true);
  });
  test("just below → not passed", () => {
    expect(didPass(49, 50)).toBe(false);
  });
  test("above → passed", () => {
    expect(didPass(80, 60)).toBe(true);
  });
});
