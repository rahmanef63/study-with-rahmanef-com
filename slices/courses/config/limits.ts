// courses slice — client-side mirror of the server bounds.
// SSOT: convex/features/courses/validate.ts (server enforces; these only
// drive form hints/maxLength). Keep in sync when the server values change.
export const MAX_MODULES_PER_COURSE = 30;
export const MAX_LESSONS_PER_COURSE = 200;
export const MAX_LINKS_PER_LESSON = 20;
export const MAX_CONTENT_MD_CHARS = 50_000;
export const COURSE_SLUG_PATTERN = "^[a-z0-9]+(-[a-z0-9]+)*$";
