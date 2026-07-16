// search feature — input validation + by-design bounds (#23).
// All checks throw ConvexError VALIDATION_FAILED via fail().
import { fail } from "./errors";

// Bounds — keep in sync with slices/search/config/limits.ts (UI mirrors).
export const MIN_QUERY_LENGTH = 2;
export const MAX_QUERY_LENGTH = 60;
export const COURSE_TAKE = 10;
export const LESSON_TAKE = 15;
export const SNIPPET_MAX = 120;
// Resources (#29): bounded index scan, then in-memory title filter — NO new
// search index (DATA-MODEL wave v1.4; upgrade to searchIndex only if weak).
export const RESOURCE_SCAN_TAKE = 50;
export const RESOURCE_TAKE = 10;

/** Search query: 2..60 chars AFTER trim (caller passes the trimmed value). */
export function assertSearchQuery(q: string): void {
  if (q.length < MIN_QUERY_LENGTH || q.length > MAX_QUERY_LENGTH) {
    fail(
      "VALIDATION_FAILED",
      `Kata kunci pencarian harus ${MIN_QUERY_LENGTH}–${MAX_QUERY_LENGTH} karakter`
    );
  }
}
