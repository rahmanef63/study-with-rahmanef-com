// The scorer. One pure, total function: `assess(answers) -> PetaResult`.
//
// TOTAL means every legal `PetaAnswers` produces a fully populated result —
// never undefined, never an empty `paths` array, never a throw. The exhaustive
// test in reachability.test.ts is what holds this claim up.
//
// It is also DETERMINISTIC: no Date, no Math.random, no env, no I/O. Same
// answers in, same plan out, on any machine, forever. That is what lets the
// result be encoded into a shareable URL later without storing a row, and it is
// what keeps the feature inside the zero-cost rule — the assessment is
// arithmetic, not a model call.
import { budgetAdvice, primaryTool } from "./budget";
import { gapsFor } from "./gaps";
import { LEVEL_LABEL, levelOf, levelReason, tally } from "./level";
import { rankPaths, type MatchContext } from "./match";
import { conceptsFor } from "./questions";
import type { ConceptId, PetaAnswers } from "./types";
import type { PetaResult } from "./result";

function headlineFor(level: string, topTitle: string): string {
  return `Level kamu ${level}. Mulai dari "${topTitle}".`;
}

export function assess(answers: PetaAnswers): PetaResult {
  const level = levelOf(answers);
  const knownSet = new Set(answers.known);
  const asked = conceptsFor(answers);
  const missing = new Set<ConceptId>();
  for (const card of asked) if (!knownSet.has(card.id)) missing.add(card.id);

  const ctx: MatchContext = {
    answers,
    level,
    known: knownSet,
    missing,
    tool: primaryTool(answers),
  };

  const paths = rankPaths(ctx);
  const label = LEVEL_LABEL[level];
  // `paths` is 2 or 3 by construction (rankPaths keeps the top two
  // unconditionally); the fallback exists only so this stays total if the
  // catalogue is ever emptied by a bad edit, which a test would catch first.
  const top = paths[0];

  return {
    level,
    levelLabel: label,
    levelReason: levelReason(answers),
    headline: headlineFor(label, top?.title ?? "Fondasi dulu"),
    paths,
    budget: budgetAdvice(answers, level),
    gaps: gapsFor(answers),
  };
}

/** Re-exported for callers that want the raw tier counts (progress screens). */
export { tally };
