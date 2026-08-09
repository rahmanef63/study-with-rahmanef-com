// Pure unit specs for the level derivation (#30). The thresholds are product
// data verified against help.skool.com/article/31 — every BOUNDARY is asserted
// exactly (threshold - 1, threshold, threshold + 1) so a typo in the table
// cannot slip through.
import { describe, expect, test } from "vitest";
import { LEVEL_THRESHOLDS, MAX_LEVEL, deriveLevel, deriveLevelInfo } from "./derive";

describe("LEVEL_THRESHOLDS", () => {
  test("is the verified 9-entry table, strictly ascending from 0", () => {
    expect([...LEVEL_THRESHOLDS]).toEqual([0, 5, 20, 65, 155, 515, 2015, 8015, 33015]);
    expect(MAX_LEVEL).toBe(9);
    for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
      expect(LEVEL_THRESHOLDS[i]).toBeGreaterThan(LEVEL_THRESHOLDS[i - 1]);
    }
  });
});

describe("deriveLevel — boundaries", () => {
  test("exactly AT each threshold gives that level", () => {
    LEVEL_THRESHOLDS.forEach((threshold, i) => {
      expect(deriveLevel(threshold)).toBe(i + 1);
    });
  });

  test("one point BELOW each threshold stays on the previous level", () => {
    LEVEL_THRESHOLDS.forEach((threshold, i) => {
      if (i === 0) return; // nothing below level 1
      expect(deriveLevel(threshold - 1)).toBe(i);
    });
  });

  test("one point ABOVE each threshold keeps that level", () => {
    LEVEL_THRESHOLDS.forEach((threshold, i) => {
      const next: number | undefined = LEVEL_THRESHOLDS[i + 1];
      if (next !== undefined && threshold + 1 >= next) return; // no gap to test
      expect(deriveLevel(threshold + 1)).toBe(i + 1);
    });
  });

  test("clamps: negatives → level 1, far past the top → level 9", () => {
    expect(deriveLevel(-1)).toBe(1);
    expect(deriveLevel(-100_000)).toBe(1);
    expect(deriveLevel(0)).toBe(1);
    expect(deriveLevel(33_015)).toBe(MAX_LEVEL);
    expect(deriveLevel(1_000_000)).toBe(MAX_LEVEL);
  });

  test.each([
    [4, 1],
    [5, 2],
    [19, 2],
    [20, 3],
    [64, 3],
    [65, 4],
    [154, 4],
    [155, 5],
    [514, 5],
    [515, 6],
    [2014, 6],
    [2015, 7],
    [8014, 7],
    [8015, 8],
    [33014, 8],
    [33015, 9],
  ])("%i poin → level %i", (points, level) => {
    expect(deriveLevel(points)).toBe(level);
  });
});

describe("deriveLevelInfo — the 'N poin lagi ke level X' inputs", () => {
  test("mid-level: floor, ceiling and the remainder", () => {
    expect(deriveLevelInfo(10)).toEqual({
      level: 2,
      levelAt: 5,
      nextLevelAt: 20,
      pointsToNext: 10,
    });
  });

  test("exactly at a threshold: the next one is a full band away", () => {
    expect(deriveLevelInfo(5)).toEqual({ level: 2, levelAt: 5, nextLevelAt: 20, pointsToNext: 15 });
  });

  test("zero points: level 1, 5 poin lagi", () => {
    expect(deriveLevelInfo(0)).toEqual({ level: 1, levelAt: 0, nextLevelAt: 5, pointsToNext: 5 });
  });

  test("MAX_LEVEL has no next threshold and no remainder", () => {
    expect(deriveLevelInfo(33_015)).toEqual({
      level: MAX_LEVEL,
      levelAt: 33_015,
      nextLevelAt: null,
      pointsToNext: null,
    });
    expect(deriveLevelInfo(99_999).pointsToNext).toBeNull();
  });
});
