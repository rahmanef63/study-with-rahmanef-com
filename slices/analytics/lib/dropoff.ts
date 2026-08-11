// analytics slice — the drop-off arithmetic, pure and dependency-free.
//
// WHY THIS IS ITS OWN MODULE. An instructor does not open this screen to learn
// their total; they open it to learn WHERE PEOPLE STOP. That question has one
// answer — a single materi — and finding it is arithmetic, not rendering. Kept
// out of the components so it can be unit-tested against the awkward cases
// (nobody started, everyone finished, one step, ties) instead of eyeballed.
//
// Everything here reads `viewedCount`, the count of DISTINCT MEMBERS who opened
// a materi. Never `viewCount` (member-days): re-reads are not extra people, and
// a funnel built on them would show retention rising above 100%.
import type { FunnelStepData } from "../types";

/** The largest single fall in readers between two consecutive materi. */
export type DropOff = {
  /** Index in `steps` of the materi people did NOT reach. Always ≥ 1. */
  stepIndex: number;
  /** 1-based teaching position of the materi they stopped AT. */
  fromPosition: number;
  fromTitle: string;
  /** 1-based teaching position of the materi they did not reach. */
  toPosition: number;
  toTitle: string;
  /** Distinct members who read `fromTitle` and never opened `toTitle`. */
  lost: number;
  /** `lost` as a share of the readers `fromTitle` still had. 1–100. */
  lostPct: number;
};

const pct = (part: number, whole: number): number =>
  whole === 0 ? 0 : Math.round((part / whole) * 100);

/**
 * The worst consecutive fall, or `null` when there is no fall to report.
 *
 * `null` is a real and common answer, not an error case: a course nobody has
 * opened, a course of one materi, and a course where every reader reached the
 * end all legitimately have no cliff. The UI must say so rather than point at
 * an arbitrary row.
 *
 * TIES GO TO THE EARLIEST step. Two equal cliffs are two problems, but the
 * first one is upstream of the second — fixing it changes who ever reaches the
 * second, so it is the only one worth acting on first.
 *
 * Measured in PEOPLE, not percent. A 50% fall from 2 readers to 1 is noise; the
 * percentage would rank it above a 30% fall from 40 to 28. `lostPct` is carried
 * along for the sentence the UI writes, never for the ranking.
 */
export function biggestDrop(steps: readonly FunnelStepData[]): DropOff | null {
  let best: DropOff | null = null;
  for (let i = 1; i < steps.length; i += 1) {
    const from = steps[i - 1];
    const to = steps[i];
    const lost = from.viewedCount - to.viewedCount;
    if (lost <= 0) continue; // flat or a rebound (someone read out of order)
    if (best !== null && lost <= best.lost) continue; // strict >: earliest wins ties
    best = {
      stepIndex: i,
      fromPosition: i,
      fromTitle: from.title,
      toPosition: i + 1,
      toTitle: to.title,
      lost,
      lostPct: pct(lost, from.viewedCount),
    };
  }
  return best;
}

/** Per-step fall in readers from the step before it. `null` for the first. */
export function lostBefore(steps: readonly FunnelStepData[], index: number): number | null {
  if (index <= 0 || index >= steps.length) return null;
  const lost = steps[index - 1].viewedCount - steps[index].viewedCount;
  return lost > 0 ? lost : null;
}

/**
 * Did anyone finish? `reachedEnd` is the last step's readers — the honest
 * bottom of the funnel, and deliberately NOT the course-completion badge count,
 * which requires marking every materi done rather than merely arriving.
 */
export function funnelEnds(steps: readonly FunnelStepData[]): {
  started: number;
  reachedEnd: number;
  reachedEndPct: number;
} {
  if (steps.length === 0) return { started: 0, reachedEnd: 0, reachedEndPct: 0 };
  const started = steps[0].viewedCount;
  const reachedEnd = steps[steps.length - 1].viewedCount;
  return { started, reachedEnd, reachedEndPct: pct(reachedEnd, started) };
}
