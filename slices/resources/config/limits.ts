// resources slice — client mirror of the server bounds
// (convex/features/resources/validate.ts + anti-spam.ts). UI validation is UX
// only; the Convex mutation re-validates every field (P0). Keep in sync.
export const MIN_TITLE = 3;
export const MAX_TITLE = 120;
export const MAX_NOTE = 500;
export const MAX_DETAIL = 1000;
export const MAX_URL = 2000;

/** Pattern for the URL <Input> — http(s) only (mirrors assertUrl). */
export const HTTP_URL_PATTERN = "https?://.+";

/** Per-user cap on pending/open items per tenant (mirrors MAX_PENDING_PER_USER). */
export const MAX_PENDING_PER_USER = 5;
