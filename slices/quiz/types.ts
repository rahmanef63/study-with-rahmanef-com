// quiz slice — public types (the barrel contract's type half).
// MIGRATION (DECISIONS #37): a quiz belongs to a COURSE and is addressed by
// its own id — `moduleId` is gone from every shape here, and the route is
// /kuis/<quizId>.
// Data shapes mirror the PROJECTIONS returned by convex/features/quiz/* (not
// raw Doc<> rows): the taking surface NEVER carries correctIndex/explanation;
// those appear only in the manage read (instructor+) and the attempt result.
import type { Id } from "@convex/_generated/dataModel";

/** Error codes thrown by convex/features/quiz (keep in sync with errors.ts). */
export type QuizErrorCode =
  | "NOT_AUTHENTICATED"
  | "NOT_AUTHORIZED"
  | "NOT_FOUND"
  | "VALIDATION_FAILED"
  | "RATE_LIMITED";

/** One question as authored in the builder (matches schema.quizzes.questions). */
export type QuizQuestionInput = {
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
};

/** getForManage result — FULL quiz (instructor+ only), answers included. */
export type QuizManageData = {
  _id: Id<"quizzes">;
  tenantId: Id<"tenants">;
  courseId: Id<"courses">;
  title: string;
  passingScorePct: number;
  questions: QuizQuestionInput[];
};

/** A taking question — SAFE projection, no answer fields. */
export type QuizPublicQuestion = {
  prompt: string;
  options: string[];
};

/** getQuizForTaking result — answer-stripped quiz for a member. */
export type QuizTakingData = {
  _id: Id<"quizzes">;
  courseId: Id<"courses">;
  tenantId: Id<"tenants">;
  title: string;
  passingScorePct: number;
  questionCount: number;
  questions: QuizPublicQuestion[];
};

/** listQuizzesForCourse row — the course page's quiz list. NEVER carries
 *  `questions`: the answer key must not ride along with a list. */
export type CourseQuizRow = {
  _id: Id<"quizzes">;
  title: string;
  passingScorePct: number;
  questionCount: number;
};

/** Per-question outcome. `isCorrect` is always present (it IS the score, per
 *  question); the answer KEY (correctIndex/explanation) is withheld by the
 *  server until it can no longer buy a better score — see `keyRevealed`. */
export type AttemptResultQuestion = {
  questionIndex: number;
  yourAnswer: number;
  correctIndex?: number;
  isCorrect: boolean;
  explanation?: string;
};

/** submitAttempt result — score + post-submission reveal. */
export type AttemptResult = {
  attemptId: Id<"quizAttempts">;
  scorePct: number;
  passed: boolean;
  correctCount: number;
  totalQuestions: number;
  passingScorePct: number;
  attemptsUsed: number;
  attemptsAllowed: number;
  /** false = the caller failed and still has tries left, so the key is hidden. */
  keyRevealed: boolean;
  results: AttemptResultQuestion[];
};

/** listMyAttempts row — the caller's own attempt history. */
export type MyAttemptRow = {
  _id: Id<"quizAttempts">;
  scorePct: number;
  passed: boolean;
  answers: number[];
  submittedAt: number;
};
