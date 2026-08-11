// Ranking and the reason sentence. The per-path arithmetic lives in scorers.ts;
// this file turns those numbers into the 2–3 cards a learner actually sees.
//
// Ranking always keeps the top TWO unconditionally, so no combination of
// answers can return zero paths — that guarantee is structural, not a check.
// The third is kept only when it is genuinely competitive, so "3 pilihan" never
// degenerates into two good ones plus a filler.
import { BUDGET_PHRASE, GOAL_PHRASE, ROLE_PHRASE, TENURE_PHRASE, TIME_PHRASE } from "./options";
import { PATHS, type PathPlan, type PlanContext } from "./paths";
import { SCORERS, type MatchContext } from "./scorers";
import { citesByStrength, supportingCites, type CiteKey } from "./support";
import type { PetaAnswers } from "./types";
import type { PathId, RankedPath } from "./result";

/** `other` has no phrase that survives "karena kamu …", so it is skipped. */
function cite(key: CiteKey, a: PetaAnswers): string | null {
  if (key === "role") return a.role === "other" ? null : ROLE_PHRASE[a.role];
  if (key === "goal") return GOAL_PHRASE[a.goal];
  if (key === "tenure") return TENURE_PHRASE[a.tenure];
  if (key === "time") return TIME_PHRASE[a.weeklyTime];
  return BUDGET_PHRASE[a.budget];
}

/**
 * Second person, and only ever built from answers that actually EARNED this
 * path its rank (see support.ts). When none of them did, the honest thing is to
 * say so: this is the card someone gets when their answers point elsewhere, and
 * dressing it as a fit is how a result screen loses its reader.
 */
export function reasonFor(id: PathId, m: MatchContext, isTop = false): string {
  const parts: string[] = [];
  for (const key of supportingCites(id, m)) {
    const phrase = cite(key, m.answers);
    if (phrase !== null && !parts.includes(phrase)) parts.push(phrase);
    if (parts.length === 2) break;
  }
  if (parts.length === 0 && isTop) {
    // The winner always owes the reader a reason — see citesByStrength.
    for (const key of citesByStrength(id, m)) {
      const phrase = cite(key, m.answers);
      if (phrase !== null) {
        parts.push(phrase);
        break;
      }
    }
  }
  if (parts.length === 0) {
    return "Bukan yang paling pas dengan jawabanmu — ambil ini kalau rencana di atas terasa terlalu pelan.";
  }
  return `Cocok karena kamu ${parts.join(" dan ")}.`;
}

const clamp = (n: number): number => (n < 0 ? 0 : n > 100 ? 100 : Math.round(n));

/**
 * Displayed match, RELATIVE to the winner rather than absolute.
 *
 * The raw scores saturate: a developer with a year of use, seven-plus hours a
 * week and every concept known scored 100 on two different paths, so the reader
 * saw two identical numbers with one of them crowned "Paling cocok" — the
 * ranking looked like a coin flip, on exactly the visitor most likely to
 * scrutinise it. Rank 1 is always 100% and the rest are shown as a share of it,
 * which is what a match badge is actually claiming: how close this is to the
 * best fit FOR YOU, not a score on some absolute scale nobody can see.
 */
const relative = (raw: number, top: number): number =>
  top <= 0 ? 0 : clamp((clamp(raw) / clamp(top)) * 100);

function toRanked(
  plan: PathPlan, raw: number, top: number, m: MatchContext, ctx: PlanContext, isTop: boolean,
): RankedPath {
  return {
    id: plan.id,
    title: plan.title,
    summary: plan.summary,
    communitySlug: plan.communitySlug,
    courses: plan.courses,
    score: relative(raw, top),
    reason: reasonFor(plan.id, m, isTop),
    thisWeek: plan.steps(ctx),
  };
}

/**
 * Two or three paths, best first. Ties break on catalogue order, so the result
 * is stable across runs and across machines — no `Math.random`, no `Date`.
 */
export function rankPaths(m: MatchContext): readonly RankedPath[] {
  const scored = PATHS.map((plan, index) => ({ plan, index, raw: SCORERS[plan.id](m) }));
  scored.sort((a, b) => (b.raw === a.raw ? a.index - b.index : b.raw - a.raw));
  const ctx: PlanContext = { answers: m.answers, level: m.level, tool: m.tool };
  // The catalogue is 8 entries long and never shrinks, so slice(0, 2) always
  // yields exactly two. The floor below is what keeps the third honest.
  const keep = scored.slice(0, 2);
  const top = scored[0];
  const third = scored[2];
  if (top !== undefined && third !== undefined && third.raw >= Math.max(8, top.raw * 0.4)) keep.push(third);
  const best = top === undefined ? 0 : top.raw;
  return keep.map((s, i) => toRanked(s.plan, s.raw, best, m, ctx, i === 0));
}

export type { MatchContext };
