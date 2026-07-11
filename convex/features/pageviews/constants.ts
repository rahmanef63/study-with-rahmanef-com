// pageviews feature — shared caps + windows for the cookieless visitor beacon.
// Pure data export (no logic) — kept out of mutations/queries so both the
// ingest and the summary read the SAME bounds.
export const DAY_MS = 86_400_000;

// Summary read is bounded most-recent-first (same rationale as the light
// anti-spam takes elsewhere: never a bare .collect()). If traffic outgrows this
// the numbers under-count — add a daily rollup then. // TODO(rr): bounded read.
export const SUMMARY_HARD_CAP = 10_000;
export const DEFAULT_WINDOW_MS = 30 * DAY_MS;

// Per-IP fixed-window ingest limiter. Generous — only throttles a runaway tab
// or bot, never a real reader (a page_view fires at most once per nav).
export const RL_WINDOW_MS = 60_000;
export const RL_MAX = 240;

// Custom-event property blob cap (JSON string). Bounds a single insert.
export const PROP_CAP = 2000;

export const VIEWPORTS = new Set(["mobile", "tablet", "desktop"]);
