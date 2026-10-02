// @vitest-environment node
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, test, vi } from "vitest";
import type { Id } from "@convex/_generated/dataModel";
import { QuizTakeView } from "../views/quiz-take-view";
import { QuizResultCard } from "../components/quiz-result-card";
import type { AttemptResult, MyAttemptRow, QuizTakingData } from "../types";

const data = vi.hoisted(() => ({ quiz: undefined as QuizTakingData | undefined,
  attempts: undefined as MyAttemptRow[] | undefined, pending: false, error: null as Error | null }));
vi.mock("../hooks/use-quiz", () => ({
  useQuizForTaking: () => { if (data.error) throw data.error; return data.quiz; },
  useMyAttempts: () => data.attempts,
}));
vi.mock("../hooks/use-quiz-mutations", () => ({ useSubmitAttempt: () => ({ submitAttempt: vi.fn(), isPending: data.pending }) }));

const quizId = "quiz" as Id<"quizzes">;
const result: AttemptResult = { attemptId: "attempt" as Id<"quizAttempts">,
  scorePct: 0, passed: false, correctCount: 0, totalQuestions: 1,
  passingScorePct: 70, attemptsUsed: 5, attemptsAllowed: 5, keyRevealed: true, results: [] };

beforeEach(() => {
  data.quiz = { _id: quizId, tenantId: "tenant" as Id<"tenants">, courseId: "course" as Id<"courses">,
    title: "Kuis AI", passingScorePct: 70, questionCount: 1, attemptsAllowed: 5,
    questions: [{ prompt: "Pilih jawaban", options: ["Benar", "Salah"] }] };
  data.attempts = [];
  data.pending = false;
  data.error = null;
});

describe("quiz attempt recovery", () => {
  test("last attempt shows the limit and removes the retry action", () => {
    const html = renderToStaticMarkup(<QuizResultCard result={result} questions={[]} onRetry={() => {}} />);
    expect(html).toContain("Batas percobaan kuis ini sudah tercapai");
    expect(html).not.toContain("Coba lagi");
    expect(html).toContain("<h1");
  });

  test("remaining attempts offer retry with the actual allowance", () => {
    const html = renderToStaticMarkup(<QuizResultCard result={{ ...result, attemptsUsed: 3 }} questions={[]} onRetry={() => {}} />);
    expect(html).toContain("Sisa percobaan: 2");
    expect(html).toContain("Coba lagi");
  });

  test("reopening an exhausted quiz does not invite another impossible submission", () => {
    data.attempts = Array.from({ length: 5 }, (_, index) => ({ _id: `a${index}` as Id<"quizAttempts">,
      scorePct: 0, passed: false, answers: [1], submittedAt: index }));
    const html = renderToStaticMarkup(<QuizTakeView quizId={quizId} backHref="/kelas/ai" />);
    expect(html).toContain("Batas percobaan kuis ini sudah tercapai");
    expect(html).not.toContain('type="radio"');
    expect(html).not.toContain("Kirim jawaban");
    expect(html).toContain('href="/kelas/ai"');
  });

  test("waits for attempt history before presenting questions", () => {
    data.attempts = undefined;
    const html = renderToStaticMarkup(<QuizTakeView quizId={quizId} />);
    expect(html).not.toContain('type="radio"');
  });

  test("waits for quiz data while keeping a reachable return path", () => {
    data.quiz = undefined;
    const html = renderToStaticMarkup(<QuizTakeView quizId={quizId} backHref="/kelas/ai" />);
    expect(html).toContain('data-slot="skeleton"');
    expect(html).toContain('href="/kelas/ai"');
    expect(html).not.toContain('type="radio"');
  });

  test("unanswered quizzes disable submission", () => {
    const html = renderToStaticMarkup(<QuizTakeView quizId={quizId} />);
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>Kirim jawaban/);
    expect(html).toContain('aria-busy="false"');
  });

  test("pending grading disables answer editing and submission", () => {
    data.pending = true;
    const html = renderToStaticMarkup(<QuizTakeView quizId={quizId} />);
    expect(html).toMatch(/<fieldset[^>]*disabled=""/);
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*aria-busy="true"[^>]*>Menilai/);
  });

  test("missing quizzes reach the host error boundary", () => {
    data.error = new Error("NOT_FOUND");
    expect(() => renderToStaticMarkup(<QuizTakeView quizId={quizId} />)).toThrow("NOT_FOUND");
  });

  test("remains compatible with the previous backend projection during rollout", () => {
    delete data.quiz!.attemptsAllowed;
    const html = renderToStaticMarkup(<QuizTakeView quizId={quizId} />);
    expect(html).toContain('type="radio"');
    expect(html).not.toContain("Sisa percobaan");
  });
});
