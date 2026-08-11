// Peta Belajar — the type contract for the assessment engine.
//
// The INPUT half: answers and questions. The output half is result.ts; both are
// re-exported from the barrel, which is the whole public shape a UI may depend
// on. The engine is pure
// TypeScript: no React, no Convex, no I/O, no clock, no randomness. Feed it a
// complete `PetaAnswers` and it returns the same `PetaResult` forever, which is
// what makes it testable exhaustively and what keeps it inside the zero-cost
// rule (DECISIONS #34): the recommendation is ARITHMETIC, never a model call.
//
// Identifiers and comments are English (AGENTS.md §7); every string VALUE that
// can reach a screen is Bahasa Indonesia.

/** How long they have used AI at all. Drives stage-3 depth AND the level. */
export type Tenure = "never" | "under3m" | "3to12m" | "over1y";

/** What they do. Nine literals — "other" is a real answer, not a fallback. */
export type Role =
  | "student"
  | "teacher"
  | "office"
  | "marketing"
  | "analyst"
  | "business-owner"
  | "developer"
  | "unemployed"
  | "other";

/** Why they are here. One choice: forcing a single goal is what makes the
 *  ranking mean anything — "semua" would flatten every path to the same score. */
export type Goal = "save-time" | "make-content" | "work-with-data" | "build-app" | "career" | "curious";

/** Monthly rupiah they are willing to spend. `zero` is a first-class plan. */
export type Budget = "zero" | "under100k" | "100to300k" | "over300k";

/** Multi-select. `none` is mutually exclusive in the UI but the engine simply
 *  ignores it when any paid entry is present, so a sloppy client cannot break
 *  the scorer. */
export type Subscription = "none" | "chatgpt-plus" | "claude-pro" | "gemini" | "other";

/** Study hours per week. */
export type WeeklyTime = "under1h" | "1to3h" | "3to7h" | "over7h";

/** The three knowledge tiers of stage 3. Which tiers are ASKED is derived from
 *  stage 1 — see `conceptsFor`. Asking a beginner about RAG is how you make
 *  someone quit, so the adaptation is load-bearing, not a nicety. */
export type ConceptTier = "dasar" | "menengah" | "lanjut";

export type ConceptId =
  // dasar — everyone
  | "prompt"
  | "hallucination"
  | "context-window"
  | "data-privacy"
  // menengah — tenure >= 3 months
  | "few-shot"
  | "chain-of-thought"
  | "projects"
  // lanjut — tenure > 1 year OR developer
  | "api"
  | "token-cost"
  | "rag"
  | "agent"
  | "mcp"
  | "fine-tuning";

/** Stage-4 branch questions. Each is asked only when its branch is open, so
 *  every field is optional and the scorer must be total without any of them. */
export type SituationAnswers = {
  /** role === "developer" */
  codingWithAi?: "routinely" | "sometimes" | "not-yet";
  /** goal === "work-with-data" || role === "analyst" */
  spreadsheetComfort?: "yes" | "somewhat" | "no";
  /** goal === "make-content" || role === "marketing" */
  hasChannel?: "active" | "dormant" | "none";
  /** budget !== "zero" — a Rp0 answer has already settled this question. */
  spendPriority?: "best-result" | "cheapest" | "unsure";
};

/** A completed run. `assess` is total over every value of this type. */
export type PetaAnswers = {
  tenure: Tenure;
  role: Role;
  goal: Goal;
  budget: Budget;
  /** May be empty; may contain "none" alongside nothing else meaningful. */
  subscriptions: readonly Subscription[];
  weeklyTime: WeeklyTime;
  /** Concepts they swiped "tahu". Anything ASKED but absent counts as a gap;
   *  anything present but never asked is ignored, so the array is safe to keep
   *  across a back-navigation that changes stage 1. */
  known: readonly ConceptId[];
  /** OPTIONAL by design: a run where no stage-4 branch opened (Rp0 + a role
   *  and goal with no branch) legitimately has none, and forcing the UI to
   *  send `{}` just to satisfy a type would be ceremony. Read it as `?? {}`. */
  situation?: SituationAnswers;
};

/** A run in progress. The question feed is a function of this. */
export type PetaDraft = Partial<PetaAnswers>;

export type PetaStageId = "kenalan" | "modal" | "pengetahuan" | "situasi";

export type PetaOption<V extends string = string> = {
  value: V;
  /** Bahasa Indonesia, short enough for a 390px button. */
  label: string;
  /** Optional second line. */
  hint?: string;
};

/** Every single-choice field. `known` and `subscriptions` are not here — they
 *  have their own question kinds. */
export type SingleChoiceField =
  | "tenure"
  | "role"
  | "goal"
  | "budget"
  | "weeklyTime"
  | keyof SituationAnswers;

export type SingleChoiceQuestion = {
  kind: "pilih-satu";
  id: SingleChoiceField;
  stage: PetaStageId;
  /** Bahasa Indonesia question text. */
  prompt: string;
  help?: string;
  options: readonly PetaOption[];
};

export type MultiChoiceQuestion = {
  kind: "pilih-banyak";
  id: "subscriptions";
  stage: "modal";
  prompt: string;
  help?: string;
  /** "none" clears the rest — the UI enforces it, the engine tolerates either. */
  exclusive: "none";
  options: readonly PetaOption<Subscription>[];
};

/** One swipe card. `tahu` → right, `belum` → left; nothing is neutral. */
export type ConceptCard = {
  id: ConceptId;
  tier: ConceptTier;
  /** The term as a learner sees it, e.g. "Jendela konteks". */
  title: string;
  /** One line, plain Bahasa Indonesia, no jargon inside the jargon. */
  blurb: string;
  /** Shown after the swipe, so a "belum" still teaches something. */
  reveal: string;
};

export type SwipeQuestion = {
  kind: "geser";
  id: "known";
  stage: "pengetahuan";
  prompt: string;
  help?: string;
  cards: readonly ConceptCard[];
};

export type PetaQuestion = SingleChoiceQuestion | MultiChoiceQuestion | SwipeQuestion;
