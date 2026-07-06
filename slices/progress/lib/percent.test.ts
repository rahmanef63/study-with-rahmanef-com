// Pure derivation of the display percent (rr "Testing": one file per behavior
// cluster). Guards the "derived, never stored" rule at the edges.
import { expect, test } from "vitest";
import { toPercent } from "./percent";

test("toPercent: 0 when the course has no lessons (no divide-by-zero)", () => {
  expect(toPercent(0, 0)).toBe(0);
  expect(toPercent(3, 0)).toBe(0);
});

test("toPercent: rounds to a whole percent", () => {
  expect(toPercent(1, 3)).toBe(33);
  expect(toPercent(2, 3)).toBe(67);
  expect(toPercent(1, 2)).toBe(50);
});

test("toPercent: clamps into 0..100", () => {
  expect(toPercent(4, 4)).toBe(100);
  expect(toPercent(5, 2)).toBe(100);
  expect(toPercent(-1, 4)).toBe(0);
});
