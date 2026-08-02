// comments feature — input validation + by-design bounds.
// All checks throw ConvexError VALIDATION_FAILED via fail(). Keep the numeric
// bounds in sync with slices/comments/config/limits.ts (the UI mirrors them).
import { fail } from "./errors";

// Body length bounds (assignment #16: bodyMd 1..2000 chars, after trim).
export const MIN_BODY = 1;
export const MAX_BODY = 2000;

/**
 * Read ceiling for listByLesson (no bare .collect(); every list is a bounded
 * .take()). Rationale: the per-user anti-spam cap (antiSpam.ts) keeps a lesson
 * thread small in practice; 200 comfortably covers an active class discussion
 * while bounding the read. Taken newest-first, so if a thread ever exceeds the
 * ceiling the OLDEST comments fall off — never the fresh discussion.
 */
export const LIST_TAKE = 200;

/** bodyMd: 1–2000 chars after trim (whitespace-only is empty → rejected). */
export function assertBody(bodyMd: string): void {
  const b = bodyMd.trim();
  if (b.length < MIN_BODY || b.length > MAX_BODY) {
    fail("VALIDATION_FAILED", `Komentar harus ${MIN_BODY}–${MAX_BODY} karakter`);
  }
}
