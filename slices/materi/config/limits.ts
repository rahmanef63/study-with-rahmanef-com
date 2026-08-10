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
 *
 * The SKILLS library ignores this and always shows its field: its search is a
 * server query over title AND prompt text, so it finds rows that are not on
 * screen — hiding it below 8 rows would hide the only way to reach them.
 */
export const SEARCH_FROM = 8;

// ── SKILLS ───────────────────────────────────────────────────────────────────

/** A skill's prompt cap (MAX_PROMPT_CHARS). Mirrored for the copy panel's
 *  character read-out; the server re-validates on write. */
export const MAX_PROMPT_CHARS = 4_000;

/** Prompt characters the server puts on a card (PROMPT_PREVIEW_CHARS). The UI
 *  never truncates again — it clamps to one line and lets CSS do the ellipsis. */
export const PROMPT_PREVIEW_CHARS = 160;

/** `searchSkills` rejects a `q` outside this window with VALIDATION_FAILED, so
 *  the hook SKIPS the query instead of sending input the server will refuse. */
export const SKILL_QUERY_MIN = 2;
export const SKILL_QUERY_MAX = 60;

/** Hits `searchSkills` returns (MAX_SEARCH_RESULTS). Not paginated — it is the
 *  top N of a bounded scan, and a search box wants one page. */
export const SKILL_SEARCH_MAX_RESULTS = 20;

/** Debounce before the reactive search re-fires while typing. Same 300ms as
 *  the global /cari box, so the two search fields feel identical. */
export const SKILL_SEARCH_DEBOUNCE_MS = 300;
