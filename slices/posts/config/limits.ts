// posts slice — UI mirrors of the server bounds. Keep in sync with
// convex/features/posts/validate.ts + antiSpam.ts (the server is the SSOT and
// re-validates every write; these only drive maxLength/counter UX).
export const MIN_TITLE = 3;
export const MAX_TITLE = 140;
export const MIN_BODY = 1;
export const MAX_BODY = 5000;
export const MAX_URL = 2000;

/** publicListFeed page ceiling (FEED_PAGE_MAX server-side). */
export const FEED_PAGE_MAX = 30;
/** How many posts the feed asks for per page. */
export const FEED_PAGE_SIZE = 10;

/** Daily caps — surfaced as a hint under the composer, enforced server-side. */
export const MAX_POSTS_PER_DAY = 10;
export const MAX_LINK_POSTS_PER_DAY = 3;

/** Plain-text excerpt length used on feed cards. */
export const EXCERPT_CHARS = 220;
