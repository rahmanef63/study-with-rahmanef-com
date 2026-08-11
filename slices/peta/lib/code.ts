// The shareable plan, encoded into one query parameter.
//
// The assessment is a PURE FUNCTION of the answers, so a plan does not need a
// database row to be shareable — the answers ARE the plan. `/mulai?p=…` gives
// a stranger a real permalink with nothing stored server-side, which is the
// zero-cost version of "share your result".
//
// Deliberately made of VALUE TOKENS, never of positional indices. An index
// scheme is shorter and quietly catastrophic: reorder one option array and
// every old link decodes into a different, entirely plausible person. A token
// that no longer exists is simply rejected by `sanitizeDraft`, which is a
// visible failure the visitor can fix by retaking the questionnaire.
import type { PetaDraft, SituationAnswers } from "@/lib/peta";
import { sanitizeDraft } from "./sanitize";

/** Query parameter the /mulai route reads. */
export const PETA_CODE_PARAM = "p";

const VERSION = "1";
const FIELD = "~";
const ITEM = ".";
const PAIR = "_";
/** Stands in for an empty segment; matches no option value anywhere. */
const NONE = "-";
/** Order is fixed by the wire format, NOT by the question feed. */
const SITUATION_KEYS = [
  "codingWithAi",
  "spreadsheetComfort",
  "hasChannel",
  "spendPriority",
] as const satisfies readonly (keyof SituationAnswers)[];

const seg = (parts: readonly string[]) => (parts.length === 0 ? NONE : parts.join(ITEM));
const unseg = (raw: string | undefined) =>
  raw === undefined || raw === NONE || raw === "" ? [] : raw.split(ITEM);
const one = (raw: string | undefined) => (raw === undefined || raw === NONE ? undefined : raw);

/**
 * A draft as a URL-safe token string. Every character used here — `~`, `.`,
 * `_`, `-` and the option tokens themselves — is unreserved, so the result
 * survives `encodeURIComponent` unchanged and stays readable in an address bar.
 */
export function encodeRun(draft: PetaDraft): string {
  const situation = SITUATION_KEYS.flatMap((key) => {
    const value = draft.situation?.[key];
    return value === undefined ? [] : [`${key}${PAIR}${value}`];
  });
  return [
    VERSION,
    draft.tenure ?? NONE,
    draft.role ?? NONE,
    draft.goal ?? NONE,
    draft.budget ?? NONE,
    seg(draft.subscriptions ?? []),
    draft.weeklyTime ?? NONE,
    seg(draft.known ?? []),
    seg(situation),
  ].join(FIELD);
}

/**
 * The inverse, hardened. Junk, a future version, or a token that no longer
 * exists all yield the longest valid PREFIX (often `{}`), never a throw and
 * never a half-legal draft — `sanitizeDraft` replays the engine's own question
 * feed to decide what is legal.
 */
export function decodeRun(code: string | null | undefined): PetaDraft {
  if (typeof code !== "string" || code.length === 0 || code.length > 2000) return {};
  const parts = code.split(FIELD);
  if (parts[0] !== VERSION) return {};
  const situation: Record<string, string> = {};
  for (const pair of unseg(parts[8])) {
    const at = pair.indexOf(PAIR);
    if (at > 0) situation[pair.slice(0, at)] = pair.slice(at + 1);
  }
  return sanitizeDraft({
    tenure: one(parts[1]),
    role: one(parts[2]),
    goal: one(parts[3]),
    budget: one(parts[4]),
    subscriptions: unseg(parts[5]),
    weeklyTime: one(parts[6]),
    known: unseg(parts[7]),
    situation,
  });
}
