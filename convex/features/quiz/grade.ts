// quiz feature — pure grading (no ctx, no I/O) so it is unit-testable in
// isolation and reused by submitAttempt. Server-side ONLY: the correct
// answers never leave the server before an attempt is graded (P0, DATA-MODEL
// "Catatan keamanan #2").

/** Minimal shape needed to grade — only the correct index matters here. */
export type GradableQuestion = { correctIndex: number };

export type GradeResult = { correctCount: number; scorePct: number };

/**
 * Grade `answers` against `questions` by exact index match. `answers[i]` that
 * is out of range (e.g. a skip sentinel) simply never equals correctIndex, so
 * it scores as wrong without special-casing. Percentage is rounded to the
 * nearest integer; an empty quiz scores 0 (cannot happen — MIN_QUESTIONS ≥ 1).
 */
export function gradeAttempt(
  questions: readonly GradableQuestion[],
  answers: readonly number[]
): GradeResult {
  let correctCount = 0;
  for (let i = 0; i < questions.length; i++) {
    if (answers[i] === questions[i].correctIndex) correctCount++;
  }
  const scorePct =
    questions.length === 0
      ? 0
      : Math.round((correctCount / questions.length) * 100);
  return { correctCount, scorePct };
}

/** passed = scorePct meets or exceeds the threshold (boundary is inclusive). */
export function didPass(scorePct: number, passingScorePct: number): boolean {
  return scorePct >= passingScorePct;
}
