// peta slice — public barrel (THE contract; barrel-only cross-slice imports).
//
// WHAT THIS SLICE IS: the /mulai questionnaire and the plan it produces. The
// SCORING is not here — it lives in `@/lib/peta`, a pure engine with no React,
// no Convex, no clock and no randomness. This slice is the half that knows
// about screens, URLs, localStorage and the live catalogue.
//
// THREE THINGS A CONSUMER CAN MOUNT:
//   <PetaView catalogue sharedCode? />   the whole run — app/mulai/page.tsx
//   <PetaEntryCard />                    the self-hiding community-home CTA
//   <PetaCallout />                      the same invitation, unconditional
//
// ANONYMOUS BY LAW (DECISIONS #34): nothing here gates on a session, prompts a
// login, or calls a paid API. The one Convex WRITE (`saveProfile`) is
// fire-and-forget for a visitor who was already signed in, and its failure is
// swallowed — the plan on screen is computed locally and stays correct.

// feature descriptor
export { petaFeature } from "./config";

// views (the integrator mounts these)
export { PetaView, type PetaViewProps } from "./views/peta-view";
export { PetaResultView, type PetaResultViewProps } from "./views/peta-result-view";

// entry points
export { PetaCallout, PETA_HREF, type PetaCalloutProps } from "./components/peta-callout";
export { PetaEntryCard } from "./components/peta-entry-card";

// deck components (presentational; exported for reuse and for the barrel test)
export { PetaProgress, type PetaProgressProps } from "./components/peta-progress";
export { ChoiceQuestion, type ChoiceQuestionProps } from "./components/choice-question";
export {
  MultiChoiceQuestion,
  type MultiChoiceQuestionProps,
} from "./components/multi-choice-question";
export { SwipeQuestion, type SwipeQuestionProps } from "./components/swipe-question";
export { SwipeCard, type SwipeCardProps } from "./components/swipe-card";

// result components
export { LevelBlock } from "./components/result/level-block";
export { PathCard, type PathCardProps } from "./components/result/path-card";
export { BudgetBlock } from "./components/result/budget-block";
export { GapsBlock, type GapsBlockProps } from "./components/result/gaps-block";
export { PrimaryCta, type PrimaryCtaProps } from "./components/result/primary-cta";
export { ResultActions, type ResultActionsProps } from "./components/result/result-actions";

// hooks
export { usePetaRun, type PetaRun } from "./hooks/use-peta-run";
export { useSavePeta, useSavedPeta } from "./hooks/use-save-peta";
export { useReducedMotion } from "./hooks/use-reduced-motion";

// lib — PURE, safe to import from a server component
export {
  communityFor,
  indexCatalogue,
  resolveAgainstCatalogue,
  type CatalogueIndex,
} from "./lib/catalogue";
export { decodeRun, encodeRun, PETA_CODE_PARAM } from "./lib/code";
export { sanitizeDraft, sanitizeSwipe, type SwipeVerdicts } from "./lib/sanitize";
export { MAX_PROFILE_ANSWERS, toProfilePayload } from "./lib/profile";
export type { ProfileAnswer, ProfilePayload } from "./lib/profile";
export {
  back,
  currentQuestion,
  EMPTY_RUN,
  normalise,
  runFromDraft,
  runSteps,
  setMulti,
  setSingle,
  setSwipe,
  type RunState,
  type RunStep,
} from "./lib/run";
export { runProgress, type RunProgress } from "./lib/run-progress";
export { clearRun, loadRun, PETA_STORAGE_KEY, saveRun, type StoredRun } from "./lib/storage";

// types
export { EMPTY_CATALOGUE } from "./types";
export type { LiveCatalogue, LiveCommunity, LiveCourse } from "./types";
