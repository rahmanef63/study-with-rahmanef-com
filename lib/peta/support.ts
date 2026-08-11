// Which of their answers actually EARNED a path its score.
//
// The reason sentence used to walk a fixed per-path list of facts and quote the
// first two that had a phrase. That reads as personalised and is not: it cites
// whatever the answer happens to be, including the answers that argue AGAINST
// the recommendation. Real output from a live run — a visitor who had never
// used AI, chose "penasaran saja" and had under an hour a week was offered
// "Bikin yang bisa dibuka orang" with "Cocok karena kamu sekadar penasaran dan
// punya kurang dari 1 jam per minggu." Both facts are reasons NOT to build a
// web app. A reason that contradicts its own recommendation is worse than no
// reason, because it teaches the reader the whole screen is generated filler.
//
// So: probe instead of assume. For one answer field, re-score the path against
// every OTHER value that field could have taken, holding everything else fixed.
// If their actual answer lands near the top of that spread, it helped, and it
// is honest to quote. If it lands near the bottom, the path was recommended
// DESPITE it and quoting it is a lie.
//
// This works against the scorers as black boxes, so tuning a weight can never
// desynchronise the sentence from the arithmetic — the failure mode a hardcoded
// cite list has by construction. Cost is a few hundred pure additions per
// assessment, which is nothing, and it stays inside DECISIONS #34: no model
// call, no network, no running cost.
import { BUDGET_OPTIONS, GOAL_OPTIONS, ROLE_OPTIONS, TENURE_OPTIONS, WEEKLY_TIME_OPTIONS } from "./options";
import { SCORERS, type MatchContext } from "./scorers";
import type { PetaAnswers } from "./types";
import type { PathId } from "./result";

export type CiteKey = "role" | "goal" | "tenure" | "time" | "budget";

/** Every value each citable field could have held. */
const DOMAIN: Record<CiteKey, readonly string[]> = {
  role: ROLE_OPTIONS.map((o) => o.value),
  goal: GOAL_OPTIONS.map((o) => o.value),
  tenure: TENURE_OPTIONS.map((o) => o.value),
  time: WEEKLY_TIME_OPTIONS.map((o) => o.value),
  budget: BUDGET_OPTIONS.map((o) => o.value),
};

const FIELD: Record<CiteKey, keyof PetaAnswers> = {
  role: "role",
  goal: "goal",
  tenure: "tenure",
  time: "weeklyTime",
  budget: "budget",
};

/**
 * How far into the top of the spread an answer must sit to count as supporting.
 * 0.34 = the top third. Loose enough that a genuinely good answer is not
 * discarded on a rounding difference, tight enough that "kurang dari 1 jam per
 * minggu" can never be offered as a reason to build software.
 */
const SUPPORT_BAND = 0.34;

/**
 * Where their answer sits in the spread of everything that field could have
 * been, as 0–1. `null` when the spread is flat: a field whose values all score
 * the same for this path decided nothing, so quoting it would quote a
 * coincidence rather than a reason.
 */
function strength(id: PathId, m: MatchContext, key: CiteKey): number | null {
  const scorer = SCORERS[id];
  const field = FIELD[key];
  const scores = DOMAIN[key].map((value) =>
    scorer({ ...m, answers: { ...m.answers, [field]: value } as PetaAnswers }),
  );
  const high = Math.max(...scores);
  const low = Math.min(...scores);
  if (high === low) return null;
  return (scorer(m) - low) / (high - low);
}

/**
 * The facts worth quoting, in the order a sentence should say them: what they
 * do, then why they are here, then how much time they have. Empty when the path
 * won on nothing the visitor told us — which happens on the second and third
 * cards for people whose answers point somewhere else entirely, and the caller
 * must then say something honest rather than invent a fit.
 */
export function supportingCites(id: PathId, m: MatchContext): readonly CiteKey[] {
  return ORDER.filter((key) => {
    const s = strength(id, m, key);
    return s !== null && s >= 1 - SUPPORT_BAND;
  });
}

/**
 * Every citable fact ranked by how much it helped, band ignored. Used for the
 * TOP recommendation only, and it exists because the exhaustive sweep found
 * personas whose answers pull in four directions at once — a developer who has
 * never used AI, wants to make content, will spend nothing and has under an
 * hour a week. Every path scores badly, nothing clears the band, and the winner
 * would have carried the "not the best fit" line while wearing the "Paling
 * cocok" badge. A rank-1 card the reader cannot be given a reason for is an
 * arbitrary recommendation. The caller walks this list rather than taking the
 * head, because the strongest fact may be one with no sayable phrase — `role:
 * "other"` is real and has nothing to put after "karena kamu".
 */
export function citesByStrength(id: PathId, m: MatchContext): readonly CiteKey[] {
  return ORDER.map((key) => ({ key, s: strength(id, m, key) }))
    .filter((e): e is { key: CiteKey; s: number } => e.s !== null)
    .sort((a, b) => (b.s === a.s ? ORDER.indexOf(a.key) - ORDER.indexOf(b.key) : b.s - a.s))
    .map((e) => e.key);
}

/** Job, then motive, then history, then capacity — how a sentence should read. */
const ORDER: readonly CiteKey[] = ["role", "goal", "tenure", "time", "budget"];
