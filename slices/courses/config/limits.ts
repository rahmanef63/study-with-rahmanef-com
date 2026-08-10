// courses slice — client-side mirror of the server bounds.
// SSOT: convex/features/courses/validate.ts (server enforces; these only
// drive form hints/maxLength). Keep in sync when the server values change.
export const MAX_LESSONS_PER_COURSE = 200;
export const MAX_LINKS_PER_LESSON = 20;
export const MAX_CONTENT_MD_CHARS = 50_000;
export const COURSE_SLUG_PATTERN = "^[a-z0-9]+(-[a-z0-9]+)*$";

// SKILL bounds. SSOT: convex/features/materi/validate.ts (assertPromptText /
// normalizeTags) — the write side lives in features/courses, so its UI mirror
// lives here. These drive maxLength + the visible counters: an author must
// meet a cap in the form, never by having a save rejected.
export const MAX_PROMPT_CHARS = 4_000;
export const MAX_TAGS_PER_LESSON = 12;
