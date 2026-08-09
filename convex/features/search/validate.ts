// search feature — input validation + by-design bounds (#23).
// All checks throw ConvexError VALIDATION_FAILED via fail().
import { fail } from "./errors";

// Bounds — keep in sync with slices/search/config/limits.ts (UI mirrors).
export const MIN_QUERY_LENGTH = 2;
export const MAX_QUERY_LENGTH = 60;
export const COURSE_TAKE = 10;
export const LESSON_TAKE = 15;
export const SNIPPET_MAX = 120;
// Posts (v1.8 #33): the Diskusi feed replaced the curated resource board as the
// third source. Unlike that board it carries a REAL search index
// (posts.search_title, filterFields tenantId), so this source upgraded from an
// in-memory contains over a bounded scan to a proper full-text range. The scan
// take stays above the result take because soft-deleted rows are dropped after
// the read (the search index carries no deletedAt column).
export const POST_SCAN_TAKE = 20;
export const POST_TAKE = 10;

/** Search query: 2..60 chars AFTER trim (caller passes the trimmed value). */
export function assertSearchQuery(q: string): void {
  if (q.length < MIN_QUERY_LENGTH || q.length > MAX_QUERY_LENGTH) {
    fail(
      "VALIDATION_FAILED",
      `Kata kunci pencarian harus ${MIN_QUERY_LENGTH}–${MAX_QUERY_LENGTH} karakter`
    );
  }
}
