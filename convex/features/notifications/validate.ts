// notifications feature — server bounds + create-input validation (#21).
// All reads are bounded (P0 "no bare .collect()"): the constants below are the
// single source for every .take(n) in this feature; the UI mirrors them via
// slices/notifications/config/limits.ts.
import { fail } from "./errors";

/** listMine: unread rows first (newest first) … */
export const UNREAD_TAKE = 30;
/** … then the most recently read rows for context. */
export const READ_TAKE = 20;
/** unreadCount cap — the badge renders "99+" at the cap. */
export const UNREAD_COUNT_CAP = 99;
/** markAllRead patches at most this many rows per call (bounded write). */
export const MARK_ALL_TAKE = 100;
/**
 * createMany inserts at most this many rows per call (bounded write, v1.4 #28).
 * Mirrors the producer-side memberships fan-out take — a recipient list larger
 * than this is a producer bug and fails loudly (VALIDATION_FAILED).
 */
export const CREATE_MANY_CAP = 200;

export const MAX_TITLE = 120;
export const MAX_BODY = 300;
export const MAX_HREF = 300;

export type CreateInput = { title: string; body?: string; href?: string };

/**
 * Validate + trim producer input for `create`. Internal producers are trusted
 * code, but a typo'd producer must fail loudly (VALIDATION_FAILED in the
 * scheduled txn's logs) instead of inserting junk rows into user inboxes.
 */
export function assertCreateInput(
  title: string,
  body: string | undefined,
  href: string | undefined
): CreateInput {
  const trimmed = title.trim();
  if (trimmed.length === 0 || trimmed.length > MAX_TITLE) {
    fail("VALIDATION_FAILED", "Judul notifikasi tidak valid");
  }
  if (body !== undefined && (body.trim().length === 0 || body.length > MAX_BODY)) {
    fail("VALIDATION_FAILED", "Isi notifikasi tidak valid");
  }
  if (href !== undefined && (!href.startsWith("/") || href.length > MAX_HREF)) {
    // Deep-links are RELATIVE OS-shell paths only — never absolute/external
    // URLs, so a buggy producer can't turn the inbox into an open redirect.
    fail("VALIDATION_FAILED", "Tautan notifikasi tidak valid");
  }
  return { title: trimmed, body, href };
}
