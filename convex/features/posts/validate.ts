// posts feature — input validation + by-design bounds (v1.8 #29/#33).
// All checks throw ConvexError VALIDATION_FAILED via fail(). Keep the numeric
// bounds in sync with slices/posts/config/limits.ts (the UI mirrors them).
import { fail } from "./errors";

// Field length bounds.
export const MIN_TITLE = 3;
export const MAX_TITLE = 140;
export const MIN_BODY = 1;
export const MAX_BODY = 5000;
export const MAX_URL = 2000;

/** publicListFeed page ceiling — a client asking for more gets this (no bare .collect()). */
export const FEED_PAGE_MAX = 30;
/** listMine result ceiling. */
export const MINE_TAKE = 50;
/**
 * listMine index-scan ceiling. The scan runs on by_author (the CALLER's own
 * rows) ordered NEWEST-FIRST, so the caller's latest post is always inside the
 * window — the opposite of the retired boards, whose by_tenant_status scan
 * walked the tenant's OLDEST rows across every user and made a member's own
 * fresh submission vanish from their own list.
 */
export const MINE_SCAN_TAKE = 200;

/** Title: 3–140 chars after trim. */
export function assertTitle(title: string): void {
  const t = title.trim();
  if (t.length < MIN_TITLE || t.length > MAX_TITLE) {
    fail("VALIDATION_FAILED", `Judul harus ${MIN_TITLE}–${MAX_TITLE} karakter`);
  }
}

/** bodyMd: 1–5000 chars after trim (whitespace-only is empty → rejected). */
export function assertBody(bodyMd: string): void {
  const b = bodyMd.trim();
  if (b.length < MIN_BODY || b.length > MAX_BODY) {
    fail("VALIDATION_FAILED", `Isi post harus ${MIN_BODY}–${MAX_BODY} karakter`);
  }
}

/**
 * Post link: http(s) only, bounded length. Rejecting non-http(s) schemes blocks
 * javascript:/data: before the link is ever rendered client-side — this feed is
 * anonymously readable and indexed, so the link surface is the spam target.
 */
export function assertLinkUrl(url: string): void {
  const u = url.trim();
  if (u.length > MAX_URL || !/^https?:\/\/[^\s]+$/i.test(u)) {
    fail("VALIDATION_FAILED", "Tautan harus diawali http:// atau https://");
  }
}

/** YouTube video id — the 11-char id, NEVER a full URL (mirrors lessons). */
export function assertYoutubeVideoId(videoId: string): void {
  if (!/^[A-Za-z0-9_-]{11}$/.test(videoId.trim())) {
    fail("VALIDATION_FAILED", "ID video YouTube harus 11 karakter (bukan URL penuh)");
  }
}

/** Clamp a client-supplied page size into [1, FEED_PAGE_MAX]. */
export function clampPageSize(numItems: number): number {
  if (!Number.isFinite(numItems) || numItems < 1) return FEED_PAGE_MAX;
  return Math.min(Math.floor(numItems), FEED_PAGE_MAX);
}
