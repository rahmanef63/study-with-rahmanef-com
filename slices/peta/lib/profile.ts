// The bridge to `features/insight/profiles.saveProfile`.
//
// Storing the result is a NICE-TO-HAVE for someone who happens to already be
// logged in — never a precondition for taking the assessment. This module only
// shapes the payload; the call site swallows every error.
//
// The backend contract is narrower than the engine's output, and both
// narrowings are deliberate:
//   · four engine levels → three stored ones. "Terbiasa" folds DOWN into
//     "pemula": it is the level for someone with hours but not vocabulary, and
//     rounding that up to "menengah" would greet them with a plan built for
//     people who are further along. The raw tenure answer is stored beside it,
//     so nothing is actually lost.
//   · answers are `{questionId, optionId}` token pairs, ≤24, one row per
//     question. Multi-select subscriptions therefore collapse into ONE row
//     whose optionId joins the picks — the alternative (a row per
//     subscription) is what would push a full 13-card run over the cap.
import { conceptsFor } from "@/lib/peta";
import type { Level, PetaAnswers, PetaResult } from "@/lib/peta";

export type ProfileAnswer = { questionId: string; optionId: string };
export type ProfilePayload = {
  level: "pemula" | "menengah" | "mahir";
  answers: ProfileAnswer[];
  pathSlugs: string[];
};

/** Server cap (`convex/features/insight/constants.ts` MAX_ANSWERS). */
export const MAX_PROFILE_ANSWERS = 24;

const LEVEL_MAP: Record<Level, ProfilePayload["level"]> = {
  pemula: "pemula",
  terbiasa: "pemula",
  menengah: "menengah",
  lanjut: "mahir",
};

/** `weeklyTime` → `weekly-time`: the server rejects any uppercase character. */
const kebab = (value: string) => value.replace(/[A-Z]/g, (ch) => `-${ch.toLowerCase()}`);

export function toProfilePayload(answers: PetaAnswers, result: PetaResult): ProfilePayload {
  const rows: ProfileAnswer[] = [
    { questionId: "tenure", optionId: answers.tenure },
    { questionId: "role", optionId: answers.role },
    { questionId: "goal", optionId: answers.goal },
    { questionId: "budget", optionId: answers.budget },
    { questionId: "weekly-time", optionId: answers.weeklyTime },
    { questionId: "subscriptions", optionId: [...answers.subscriptions].sort().join("-") },
  ];
  for (const [field, value] of Object.entries(answers.situation ?? {})) {
    if (typeof value === "string") rows.push({ questionId: kebab(field), optionId: value });
  }
  // Only cards that were ASKED. A `known` entry carried over from a longer run
  // is not evidence of anything — the engine ignores it too (level.ts `tally`).
  const known = new Set<string>(answers.known);
  for (const card of conceptsFor(answers)) {
    rows.push({ questionId: card.id, optionId: known.has(card.id) ? "tahu" : "belum" });
  }
  return {
    level: LEVEL_MAP[result.level],
    // The cap can only bite if the engine grows a longer deck; truncating the
    // TAIL keeps the identity answers, which are the ones worth storing.
    answers: rows.slice(0, MAX_PROFILE_ANSWERS),
    pathSlugs: result.paths.map((path) => path.id),
  };
}
