// resources feature — input validation + by-design bounds.
// All checks throw ConvexError VALIDATION_FAILED via fail(). Keep the numeric
// bounds in sync with slices/resources/config/limits.ts (the UI mirrors them).
import { fail } from "./errors";

// Read/scan bounds (no bare .collect() — every list is a bounded .take()).
export const LIST_TAKE = 50;
export const MINE_TAKE = 50;

// Field length bounds.
export const MAX_TITLE = 120;
export const MIN_TITLE = 3;
export const MAX_NOTE = 500;
export const MAX_DETAIL = 1000;
export const MAX_URL = 2000;

/** Title (resource + suggestion): 3–120 chars after trim. */
export function assertTitle(title: string): void {
  const t = title.trim();
  if (t.length < MIN_TITLE || t.length > MAX_TITLE) {
    fail("VALIDATION_FAILED", `Judul harus ${MIN_TITLE}–${MAX_TITLE} karakter`);
  }
}

/**
 * Resource URL: http(s) only, bounded length. Rejecting non-http(s) schemes
 * blocks javascript:/data: and other injection vectors before the link is ever
 * rendered client-side.
 */
export function assertUrl(url: string): void {
  const u = url.trim();
  if (u.length > MAX_URL || !/^https?:\/\/[^\s]+$/i.test(u)) {
    fail("VALIDATION_FAILED", "URL harus diawali http:// atau https://");
  }
}

/** Optional resource note: bounded when present. */
export function assertNote(note: string): void {
  if (note.length > MAX_NOTE) {
    fail("VALIDATION_FAILED", `Catatan maksimal ${MAX_NOTE} karakter`);
  }
}

/** Optional suggestion detail: bounded when present. */
export function assertDetail(detail: string): void {
  if (detail.length > MAX_DETAIL) {
    fail("VALIDATION_FAILED", `Detail maksimal ${MAX_DETAIL} karakter`);
  }
}
