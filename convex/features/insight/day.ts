// insight feature — the day key, as a PURE FUNCTION of a timestamp. Its own
// module so the calendar rule is unit-testable without a database, and so there
// is exactly one definition of "hari ini" in the feature.
//
// WHY JAKARTA AND NOT UTC. The audience is Indonesian. Under UTC, everything
// read between 07:00 and midnight WIB lands on the "next" day, so the daily
// idempotency window would cut a learner's evening in half and "active this
// week" would be shifted by a third of a day. WIB is UTC+7 with NO DST, so this
// stays one addition — no timezone library, no dependency (AGENTS.md: NO NEW
// NPM DEPENDENCY), and no ambiguous hour twice a year.

/** Asia/Jakarta = UTC+7, fixed. Indonesia has not observed DST since 1964. */
export const JAKARTA_OFFSET_MS = 7 * 60 * 60 * 1000;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * "YYYY-MM-DD" for `atMs` in Asia/Jakarta.
 *
 * Lexicographic order equals chronological order for this format, which is the
 * whole reason it is a string: `materiViews.by_tenant_day` becomes an ordinary
 * indexed range scan instead of needing a numeric epoch-day column that nobody
 * could read in the dashboard.
 */
export function dayKey(atMs: number): string {
  return new Date(atMs + JAKARTA_OFFSET_MS).toISOString().slice(0, 10);
}

/**
 * Inclusive [from, to] day-key window covering the last `days` days, today
 * included. `weekWindow(now)` → 7 keys: six days back through today.
 * `days` below 1 is clamped to 1 (a zero-width window is never what a caller
 * means, and a negative one would invert the range scan silently).
 */
export function dayWindow(atMs: number, days: number): { from: string; to: string } {
  const span = Math.max(1, Math.floor(days));
  return { from: dayKey(atMs - (span - 1) * MS_PER_DAY), to: dayKey(atMs) };
}

/** The rolling 7-day window used by tenantPulse ("minggu ini"). */
export function weekWindow(atMs: number): { from: string; to: string } {
  return dayWindow(atMs, 7);
}

/** Start of the pulse week as an epoch ms, for filtering `_creationTime`. */
export function weekStartMs(atMs: number): number {
  const startOfTodayWib = Math.floor((atMs + JAKARTA_OFFSET_MS) / MS_PER_DAY) * MS_PER_DAY;
  return startOfTodayWib - JAKARTA_OFFSET_MS - 6 * MS_PER_DAY;
}
