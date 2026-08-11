// The drop-off arithmetic — the only logic in this slice that can be WRONG in
// a way nobody notices. A miscoloured bar is visible; pointing an instructor at
// materi 7 when people actually quit at materi 3 is not, and it is the one
// number this whole screen exists to produce.
//
// Alias-free relative imports (the shared vitest config has no `@/*` alias),
// same arrangement as barrel.test.ts.
import { describe, expect, test } from "vitest";
import { biggestDrop, funnelEnds, lostBefore } from "../lib/dropoff";
import type { FunnelStepData } from "../types";

/** Only the fields the arithmetic reads; the rest are filler. */
function steps(viewers: number[]): FunnelStepData[] {
  return viewers.map((viewedCount, i) => ({
    lessonId: `lesson-${i}` as FunnelStepData["lessonId"],
    title: `Materi ${i + 1}`,
    order: i,
    viewedCount,
    viewCount: viewedCount,
    completedCount: 0,
    completionRatePct: 0,
    retentionPct: viewers[0] === 0 ? 0 : Math.round((viewedCount / viewers[0]) * 100),
  }));
}

describe("biggestDrop — where people stop", () => {
  test("finds the cliff and names both sides of it", () => {
    const drop = biggestDrop(steps([20, 18, 6, 5]));
    expect(drop).toMatchObject({
      stepIndex: 2,
      fromPosition: 2,
      fromTitle: "Materi 2",
      toPosition: 3,
      toTitle: "Materi 3",
      lost: 12,
    });
    // 12 of the 18 who reached Materi 2.
    expect(drop?.lostPct).toBe(67);
  });

  test("ranks by PEOPLE, not percent — the two genuinely disagree here", () => {
    // 100 → 60 → 2 → 0.
    //   people lost: 40, 58, 2
    //   share lost:  40%, 97%, 100%   ← a percent ranking would pick the LAST
    //                                   step, where two stragglers vanish.
    // The answer an instructor can act on is materi 3, which swallowed 58.
    const drop = biggestDrop(steps([100, 60, 2, 0]));
    expect(drop).toMatchObject({ stepIndex: 2, toPosition: 3, lost: 58 });
    expect(drop?.lostPct).toBe(97);
  });

  test("ties go to the EARLIEST cliff — it is upstream of the other one", () => {
    const drop = biggestDrop(steps([10, 5, 5, 0]));
    expect(drop?.stepIndex).toBe(1);
    expect(drop?.lost).toBe(5);
  });

  test("null when there is nothing to report", () => {
    expect(biggestDrop([])).toBeNull();
    expect(biggestDrop(steps([7]))).toBeNull(); // one materi has no "between"
    expect(biggestDrop(steps([0, 0, 0]))).toBeNull(); // nobody started
    expect(biggestDrop(steps([5, 5, 5]))).toBeNull(); // everyone reached the end
  });

  test("a rebound is not a drop — materi read out of order never invents one", () => {
    // Step 3 has MORE readers than step 2 (someone jumped straight to it from
    // the library). The only real fall is 9 → 4.
    const drop = biggestDrop(steps([9, 4, 7]));
    expect(drop).toMatchObject({ stepIndex: 1, lost: 5 });
  });

  test("lostPct never divides by zero", () => {
    // A step with 0 readers followed by 0 produces no drop at all, so the only
    // way to reach the division is from a positive step.
    expect(biggestDrop(steps([0, 0]))).toBeNull();
    expect(biggestDrop(steps([3, 0]))?.lostPct).toBe(100);
  });
});

describe("lostBefore — the per-row marker", () => {
  test("null on the first row and on flat or rising rows", () => {
    const rows = steps([10, 10, 4, 6]);
    expect(lostBefore(rows, 0)).toBeNull();
    expect(lostBefore(rows, 1)).toBeNull(); // flat
    expect(lostBefore(rows, 2)).toBe(6);
    expect(lostBefore(rows, 3)).toBeNull(); // rebound
  });

  test("out-of-range indexes are null, never a crash", () => {
    const rows = steps([5, 3]);
    expect(lostBefore(rows, -1)).toBeNull();
    expect(lostBefore(rows, 9)).toBeNull();
    expect(lostBefore([], 0)).toBeNull();
  });
});

describe("funnelEnds — the two stat cards", () => {
  test("start and finish are the first and LAST step, not the max and min", () => {
    expect(funnelEnds(steps([20, 4, 9]))).toEqual({
      started: 20,
      reachedEnd: 9,
      reachedEndPct: 45,
    });
  });

  test("an empty or unread course reports zeros rather than NaN", () => {
    expect(funnelEnds([])).toEqual({ started: 0, reachedEnd: 0, reachedEndPct: 0 });
    expect(funnelEnds(steps([0, 0]))).toEqual({
      started: 0,
      reachedEnd: 0,
      reachedEndPct: 0,
    });
  });

  test("a single-materi course is 100% retained, which is honest", () => {
    expect(funnelEnds(steps([6]))).toEqual({ started: 6, reachedEnd: 6, reachedEndPct: 100 });
  });
});
