// quiz feature — input validation + by-design bounds. All checks throw
// ConvexError VALIDATION_FAILED via fail(). These run in the mutation AFTER
// authz (P0 order) and BEFORE any write.
import { fail } from "./errors";

// Bounds — mirrored in slices/quiz/config/limits.ts (UI form hints copy them).
export const MIN_OPTIONS = 2;
export const MAX_OPTIONS = 6;
export const MIN_QUESTIONS = 1;
export const MAX_QUESTIONS = 50;
export const MAX_PROMPT_CHARS = 500;
export const MAX_OPTION_CHARS = 200;
export const MAX_EXPLANATION_CHARS = 1000;
export const ATTEMPTS_TAKE = 50;

/** Question shape as accepted from the builder client (matches schema). */
export type QuestionInput = {
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
};

export function assertTitle(title: string): void {
  const t = title.trim();
  if (t.length < 3 || t.length > 120) {
    fail("VALIDATION_FAILED", "Judul kuis harus 3–120 karakter");
  }
}

/** passingScorePct is an integer percentage 0–100 (DATA-MODEL). */
export function assertPassingScore(pct: number): void {
  if (!Number.isInteger(pct) || pct < 0 || pct > 100) {
    fail("VALIDATION_FAILED", "Nilai kelulusan harus bilangan bulat 0–100");
  }
}

/**
 * Validate the whole question set: count bounds, per-question prompt, 2–6
 * non-empty options, and correctIndex within the option range. correctIndex
 * out of range is the classic builder footgun — reject it here so a member can
 * never be graded against an impossible answer.
 */
export function assertQuestions(questions: QuestionInput[]): void {
  if (questions.length < MIN_QUESTIONS || questions.length > MAX_QUESTIONS) {
    fail("VALIDATION_FAILED", `Kuis harus punya ${MIN_QUESTIONS}–${MAX_QUESTIONS} soal`);
  }
  for (const q of questions) {
    if (q.prompt.trim().length < 3 || q.prompt.length > MAX_PROMPT_CHARS) {
      fail("VALIDATION_FAILED", `Pertanyaan harus 3–${MAX_PROMPT_CHARS} karakter`);
    }
    if (q.options.length < MIN_OPTIONS || q.options.length > MAX_OPTIONS) {
      fail("VALIDATION_FAILED", `Setiap soal harus punya ${MIN_OPTIONS}–${MAX_OPTIONS} pilihan`);
    }
    for (const opt of q.options) {
      if (opt.trim().length < 1 || opt.length > MAX_OPTION_CHARS) {
        fail("VALIDATION_FAILED", `Pilihan jawaban harus 1–${MAX_OPTION_CHARS} karakter`);
      }
    }
    if (!Number.isInteger(q.correctIndex) || q.correctIndex < 0 || q.correctIndex >= q.options.length) {
      fail("VALIDATION_FAILED", "Kunci jawaban harus menunjuk salah satu pilihan");
    }
    if (q.explanation !== undefined && q.explanation.length > MAX_EXPLANATION_CHARS) {
      fail("VALIDATION_FAILED", `Penjelasan maksimal ${MAX_EXPLANATION_CHARS} karakter`);
    }
  }
}

/**
 * Validate a submitted answer array against the quiz's questions: one answer
 * per question, each an integer pointing at a real option. Prevents malformed
 * or padded submissions from a crafted client.
 */
export function assertAnswers(
  answers: number[],
  questions: readonly { options: readonly string[] }[]
): void {
  if (answers.length !== questions.length) {
    fail("VALIDATION_FAILED", "Jumlah jawaban tidak sesuai dengan jumlah soal");
  }
  for (let i = 0; i < answers.length; i++) {
    const a = answers[i];
    if (!Number.isInteger(a) || a < 0 || a >= questions[i].options.length) {
      fail("VALIDATION_FAILED", "Jawaban tidak valid untuk salah satu soal");
    }
  }
}
