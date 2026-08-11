// Peta Belajar — the barrel. THIS is the contract; nothing outside `lib/peta`
// may deep-import a sibling module.
//
// The engine is pure TypeScript: no React, no Convex, no fetch, no clock, no
// randomness. Two entry points matter to a UI:
//
//   nextQuestion(draft)  → what to ask next, adapted to what they answered
//   assess(answers)      → the level, 2–3 ranked paths, budget advice, gaps
//
// A worked run, start to finish:
//
//   let draft: PetaDraft = {};
//   for (let q = nextQuestion(draft); q !== null; q = nextQuestion(draft)) {
//     // render q by q.kind: "pilih-satu" | "pilih-banyak" | "geser"
//     draft = { ...draft, [q.id]: answerFromUser };   // situasi → draft.situation
//   }
//   if (isComplete(draft)) setResult(assess(draft));
//
// Build hrefs with `communityHref` from `lib/community.ts`:
//   path.courses[0] → communityHref.course(communitySlug, courseSlug)
//   gap.materi      → communityHref.materiPage(communitySlug, materiSlug)
export type {
  Budget,
  ConceptCard,
  ConceptId,
  ConceptTier,
  Goal,
  MultiChoiceQuestion,
  PetaAnswers,
  PetaDraft,
  PetaOption,
  PetaQuestion,
  PetaStageId,
  Role,
  SingleChoiceField,
  SingleChoiceQuestion,
  SituationAnswers,
  Subscription,
  SwipeQuestion,
  Tenure,
  WeeklyTime,
} from "./types";
export type {
  BudgetAdvice,
  CourseRef,
  KnowledgeGap,
  Level,
  MateriRef,
  PathId,
  PetaResult,
  RankedPath,
} from "./result";

export { assess, tally } from "./assess";
export { conceptsFor, isComplete, nextQuestion, progress, questionsFor, situationFieldsFor } from "./questions";
export { LEVEL_LABEL, levelOf, levelReason } from "./level";
export { budgetAdvice, paidSubscriptions, primaryTool } from "./budget";
export { gapsFor, MAX_GAPS } from "./gaps";
export { rankPaths, reasonFor } from "./match";
export type { MatchContext } from "./match";
export { COURSE, PATHS, PATH_BY_ID } from "./paths";
export type { PathPlan, PlanContext } from "./paths";
export { CONCEPTS, CONCEPT_MATERI, CONCEPT_WHY, conceptById, conceptsInTier } from "./concepts";
export {
  BUDGET_OPTIONS,
  GOAL_OPTIONS,
  ROLE_OPTIONS,
  SUBSCRIPTION_OPTIONS,
  TENURE_OPTIONS,
  WEEKLY_TIME_OPTIONS,
} from "./options";
