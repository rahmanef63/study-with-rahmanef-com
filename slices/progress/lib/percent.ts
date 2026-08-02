// progress slice — pure derivation of the display percentage. Kept out of the
// component so it is unit-testable and so the rule "progress is derived, never
// stored" (docs/DATA-MODEL.md) is visible in one place. Server stores neither
// this number nor the ratio — it is computed on every render from counts.

/** Whole-number completion percent (0–100); 0 when the course has no lessons. */
export function toPercent(completedCount: number, totalCount: number): number {
  if (totalCount <= 0) return 0;
  const ratio = completedCount / totalCount;
  const clamped = Math.max(0, Math.min(1, ratio));
  return Math.round(clamped * 100);
}
