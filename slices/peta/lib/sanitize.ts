// Turn UNTRUSTED input (localStorage, a pasted share link) into a draft the
// engine will accept.
//
// The validator is the ENGINE ITSELF: it replays `nextQuestion` and accepts a
// value only when it is one of the options that question actually offers. So
// there is no second copy of the option lists to drift out of sync, and a
// question added upstream is validated the day it ships. Anything unrecognised
// truncates the run at that point — a partially restored draft just means the
// visitor resumes one question earlier, never that junk reaches `assess`.
import { CONCEPTS, nextQuestion } from "@/lib/peta";
import type { ConceptId, PetaDraft, PetaQuestion, SituationAnswers } from "@/lib/peta";

const CONCEPT_IDS = new Set<string>(CONCEPTS.map((card) => card.id));

/** The swipe deck's per-card verdicts, kept beside the draft so a run that was
 *  abandoned mid-deck resumes on the exact card it stopped on. */
export type SwipeVerdicts = Record<string, boolean>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function readField(source: Record<string, unknown>, q: PetaQuestion): unknown {
  if (q.kind !== "pilih-satu" || q.stage !== "situasi") return source[q.id];
  const situation = source.situation;
  return isRecord(situation) ? situation[q.id] : undefined;
}

/** One question's answer, or null when the stored value is not a legal option. */
function apply(draft: PetaDraft, q: PetaQuestion, raw: unknown): PetaDraft | null {
  if (q.kind === "geser") {
    if (!Array.isArray(raw)) return null;
    const offered = new Set<string>(q.cards.map((card) => card.id));
    const known = raw.filter(
      (id): id is ConceptId => typeof id === "string" && offered.has(id)
    );
    return { ...draft, known };
  }
  if (q.kind === "pilih-banyak") {
    if (!Array.isArray(raw)) return null;
    const offered = new Set<string>(q.options.map((o) => o.value));
    const picked = raw.filter((v): v is string => typeof v === "string" && offered.has(v));
    if (picked.length === 0) return null;
    return { ...draft, subscriptions: picked as PetaDraft["subscriptions"] };
  }
  if (typeof raw !== "string" || !q.options.some((o) => o.value === raw)) return null;
  if (q.stage === "situasi") {
    const situation = { ...draft.situation, [q.id]: raw } as SituationAnswers;
    return { ...draft, situation };
  }
  return { ...draft, [q.id]: raw } as PetaDraft;
}

/**
 * The longest VALID PREFIX of a stored draft. Bounded by the question feed, so
 * a hostile `known: [...]` of ten thousand entries cannot spin here.
 */
export function sanitizeDraft(raw: unknown): PetaDraft {
  if (!isRecord(raw)) return {};
  let draft: PetaDraft = {};
  for (;;) {
    const q = nextQuestion(draft);
    if (q === null) return draft;
    const next = apply(draft, q, readField(raw, q));
    if (next === null) return draft;
    draft = next;
  }
}

/** Per-card verdicts, filtered to real concept ids with boolean values. */
export function sanitizeSwipe(raw: unknown): SwipeVerdicts {
  if (!isRecord(raw)) return {};
  const out: SwipeVerdicts = {};
  for (const [id, value] of Object.entries(raw)) {
    if (CONCEPT_IDS.has(id) && typeof value === "boolean") out[id] = value;
  }
  return out;
}
