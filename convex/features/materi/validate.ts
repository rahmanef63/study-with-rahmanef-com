// materi feature — input validation + by-design bounds.
// Every read here is bounded by one of these constants; there is no unbounded
// scan and no bare .collect() anywhere in the feature (AGENTS.md §6).
import { fail } from "./errors";

/** Tags a single materi may carry. Small on purpose: a tag list is navigation,
 *  not metadata — a page with 30 tags has none. */
export const MAX_TAGS_PER_LESSON = 12;
/** Raw array length accepted before normalisation (rejects obvious abuse). */
export const MAX_TAG_INPUT = 50;
export const TAG_MIN_LENGTH = 2;
export const TAG_MAX_LENGTH = 32;

/** Outgoing materi→materi references reconciled per save. */
export const MAX_REFS_PER_LESSON = 50;
/** Existing ref rows read for the diff — slack over the cap so a row set left
 *  by an older, higher cap is still read whole and can therefore be pruned. */
export const REF_ROW_TAKE = 100;

/** Per-lesson bounded reads. Slack over MAX_TAGS_PER_LESSON so a row set that
 *  predates a lower cap is still read whole (and therefore still diffable). */
export const TAG_ROW_TAKE = 64;
export const PLACEMENT_TAKE = 50;
export const BACKLINK_TAKE = 50;

/** listTags: bounded scan of one tenant's tag rows, then grouped in memory. */
export const TAG_SCAN_TAKE = 500;
export const MAX_TAGS_RETURNED = 100;

/** listLibrary page ceiling — each row costs two extra index reads (tags +
 *  placements), so pages stay small. */
export const LIBRARY_PAGE_MAX = 20;

/** publicListSlugs: one tenant's whole indexable materi set in one read. The
 *  sitemap is revalidated hourly and the biggest community has 76 materi, so a
 *  single bounded take is cheaper than paginating. Past this the sitemap
 *  truncates rather than growing unbounded. */
export const SITEMAP_TAKE = 1000;

/**
 * A skill's prompt cap. 4 000 characters ≈ 1 000 tokens: room for a long,
 * structured system prompt while staying something you copy into a chat box,
 * not an essay — explanation, examples and variations belong in the body, which
 * has its own 50 000-char cap and its own search index. It is also a READ-COST
 * bound: every skills-library card and every skills-library search reads this
 * column, so an uncapped prompt would make browsing the library expensive.
 * Enforced on the write side by `features/courses/lessons.assertPromptText`.
 */
export const MAX_PROMPT_CHARS = 4_000;

/**
 * A prompt requires `kind: "skill"` — a materi with a prompt panel is a skill
 * nobody labelled, and it would preview in the wrong library. `kind` is the
 * ROW'S own kind at every call site, never a client-supplied one.
 */
export function assertPromptText(
  promptText: string,
  kind: "materi" | "skill" | undefined
): string {
  if (kind !== "skill") fail("VALIDATION_FAILED", "Prompt hanya untuk materi bertipe skill");
  const text = promptText.trim();
  if (text === "" || text.length > MAX_PROMPT_CHARS) {
    fail("VALIDATION_FAILED", `Prompt wajib diisi, maksimal ${MAX_PROMPT_CHARS} karakter`);
  }
  return text;
}

/** Characters of a skill's prompt a library card previews. Two lines of a
 *  card, no more: the card is a chooser, the prompt panel is the reader. */
export const PROMPT_PREVIEW_CHARS = 160;

/**
 * Skills scanned by `skills.searchSkills`. The skills library is a curated
 * prompt catalogue, not the whole materi corpus, and it is ONE exact index
 * range — so a bounded scan can match title + promptText in memory instead of
 * needing a search index the table is not allowed to grow. Past this the search
 * truncates rather than becoming unbounded; the read stays ~1 MB worst case
 * because `promptText` is capped at 4 000 chars on the write side.
 */
export const SKILL_SCAN_TAKE = 200;
/** Matches one search returns. Same ceiling as a library page, on purpose. */
export const MAX_SEARCH_RESULTS = LIBRARY_PAGE_MAX;
const SEARCH_Q_MIN = 2;
const SEARCH_Q_MAX = 60;

/** Truncate a prompt for a card. Cuts on a word boundary when there is one. */
export function promptPreview(promptText: string | undefined): string | null {
  if (promptText === undefined) return null;
  const flat = promptText.replace(/\s+/g, " ").trim();
  if (flat === "") return null;
  if (flat.length <= PROMPT_PREVIEW_CHARS) return flat;
  const cut = flat.slice(0, PROMPT_PREVIEW_CHARS);
  const space = cut.lastIndexOf(" ");
  return `${space > PROMPT_PREVIEW_CHARS / 2 ? cut.slice(0, space) : cut}…`;
}

/**
 * Normalise + bound a skills-library search term. Mirrors features/search's
 * 2–60 rule so one search box cannot behave differently on two pages. Returns
 * the lowercased needle; anything outside the range is VALIDATION_FAILED, never
 * a scan.
 */
export function normalizeSearchQuery(q: string): string {
  const needle = q.trim().toLowerCase();
  if (needle.length < SEARCH_Q_MIN || needle.length > SEARCH_Q_MAX) {
    fail("VALIDATION_FAILED", `Kata kunci harus ${SEARCH_Q_MIN}–${SEARCH_Q_MAX} karakter`);
  }
  return needle;
}

/** Longest slug the backfill can mint (`baseSlug` 64 + numeric suffix). */
const SLUG_MAX_LENGTH = 80;
const KEBAB_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Cheap shape guard for a slug arriving from a URL segment. Not authz — it only
 * keeps junk from becoming an index probe. Callers treat `false` as "no such
 * materi", never as a distinct error, so it leaks nothing.
 */
export function isLessonSlug(slug: string): boolean {
  return slug.length > 0 && slug.length <= SLUG_MAX_LENGTH && KEBAB_RE.test(slug);
}

/**
 * Lowercase + trim + collapse whitespace to `-` + dedupe, preserving the
 * caller's order. Anything that is not kebab-case after normalisation is a
 * VALIDATION_FAILED rather than a silent mangle — a tag the author cannot
 * predict is worse than an error they can read.
 */
export function normalizeTags(tags: readonly string[]): string[] {
  if (tags.length > MAX_TAG_INPUT) {
    fail("VALIDATION_FAILED", `Maksimal ${MAX_TAGS_PER_LESSON} tag per materi`);
  }
  const out: string[] = [];
  for (const raw of tags) {
    const tag = raw
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/-{2,}/g, "-")
      .replace(/^-+|-+$/g, "");
    if (tag === "") continue; // an empty chip is a no-op, not an error
    if (tag.length < TAG_MIN_LENGTH || tag.length > TAG_MAX_LENGTH) {
      fail(
        "VALIDATION_FAILED",
        `Tag harus ${TAG_MIN_LENGTH}–${TAG_MAX_LENGTH} karakter`
      );
    }
    if (!KEBAB_RE.test(tag)) {
      fail(
        "VALIDATION_FAILED",
        "Tag hanya boleh huruf kecil, angka, dan tanda minus"
      );
    }
    if (!out.includes(tag)) out.push(tag);
  }
  if (out.length > MAX_TAGS_PER_LESSON) {
    fail("VALIDATION_FAILED", `Maksimal ${MAX_TAGS_PER_LESSON} tag per materi`);
  }
  return out;
}

/** Same normalisation as a tag, for the `tag` filter on listLibrary. Returns
 *  null when the filter cannot match anything, so the caller answers empty. */
export function normalizeTagFilter(tag: string): string | null {
  const normalized = tag.trim().toLowerCase().replace(/\s+/g, "-");
  return normalized.length >= TAG_MIN_LENGTH &&
    normalized.length <= TAG_MAX_LENGTH &&
    KEBAB_RE.test(normalized)
    ? normalized
    : null;
}

/** Clamp a client-supplied page size into the bounded range. */
export function clampPageSize(numItems: number): number {
  if (!Number.isFinite(numItems) || numItems <= 0) return LIBRARY_PAGE_MAX;
  return Math.min(Math.floor(numItems), LIBRARY_PAGE_MAX);
}
