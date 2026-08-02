// quiz slice — public barrel (THE contract; barrel-only cross-slice imports,
// rr-conventions P1). Consumer: integrator (#8 mounts the two views into the
// /t/[slug] course/lesson surfaces). Convex surface (not re-exported here —
// call via api.features.quiz.*):
//   builder.createQuiz · builder.updateQuiz · builder.deleteQuiz
//   manage.getForManage (instructor+, full quiz)
//   taking.getQuizForTaking (member, ANSWER-STRIPPED) · taking.listMyAttempts
//   attempts.submitAttempt (member, server-graded)

// feature descriptor
export { quizFeature } from "./config";

// route-level client views (integrator mounts these under /t/[slug]/…)
export { QuizBuilderView, type QuizBuilderViewProps } from "./views/quiz-builder-view";
export { QuizTakeView, type QuizTakeViewProps } from "./views/quiz-take-view";

// components (presentational — reusable if the integrator composes its own view)
export { QuizResultCard, type QuizResultCardProps } from "./components/quiz-result-card";
export { QuizQuestionCard, type QuizQuestionCardProps } from "./components/quiz-question-card";
export { QuizQuestionEditor, type QuizQuestionEditorProps } from "./components/quiz-question-editor";
export {
  QuizBuilderForm,
  type QuizBuilderFormProps,
  type QuizBuilderFormValues,
} from "./components/quiz-builder-form";

// hooks (reads + writes)
export { useQuizForTaking, useQuizForManage, useMyAttempts } from "./hooks/use-quiz";
export {
  useQuizBuilderMutations,
  useSubmitAttempt,
  type SaveQuizInput,
} from "./hooks/use-quiz-mutations";

// lib (pure — safe for server or client)
export { quizErrorMessage, extractQuizError } from "./lib/errors";

// copy + limits (props-driven defaults)
export { QUIZ_COPY, mergeQuizCopy, type QuizCopy, type QuizCopyOverride } from "./config/copy";
export {
  MAX_OPTIONS,
  MAX_QUESTIONS,
  MIN_OPTIONS,
  MIN_QUESTIONS,
  MAX_PROMPT_CHARS,
  MAX_OPTION_CHARS,
  MAX_EXPLANATION_CHARS,
  MAX_TITLE_CHARS,
} from "./config/limits";

// types
export type {
  AttemptResult,
  AttemptResultQuestion,
  MyAttemptRow,
  QuizErrorCode,
  QuizManageData,
  QuizPublicQuestion,
  QuizQuestionInput,
  QuizTakingData,
} from "./types";
