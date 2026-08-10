// materi slice — UI mirrors of the server bounds
// (convex/features/materi/validate.ts). Mirrors, never a second source of
// truth: the server clamps everything again, so the worst a drift here can do
// is ask for a page the server trims.

/** Server ceiling for one library page (`clampPageSize`). */
export const LIBRARY_PAGE_MAX = 20;
/** What the library actually asks for. A full page is ~14 rows on a 390px
 *  screen, so 20 fills the viewport once and leaves a reason to scroll. */
export const LIBRARY_PAGE_SIZE = 20;

/** Tags one materi may carry (MAX_TAGS_PER_LESSON). */
export const MAX_TAGS_PER_LESSON = 12;
/** Tag rows `listTags` will return (MAX_TAGS_RETURNED). */
export const MAX_TAGS_RETURNED = 100;

/**
 * Tag chips rendered before the rack is cut off. The strip scrolls, so this is
 * about read time, not width: past a dozen chips a filter row stops being a
 * glanceable index and becomes a second list to search.
 */
export const TAG_CHIPS_SHOWN = 12;

/**
 * Below this many loaded rows the search field is pure chrome — a 46px control
 * in front of a list you can read in one glance. Same threshold as the Anggota
 * roster, deliberately.
 */
export const SEARCH_FROM = 8;
