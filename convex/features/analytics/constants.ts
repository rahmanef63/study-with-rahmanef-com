// analytics feature — by-design ceilings for every counting read (P1: no bare
// .collect(); every read is .withIndex(...).take(cap)). All analytics numbers
// are DERIVED on read, never stored (docs/DATA-MODEL.md "Derivasi & invarian").
// If a table ever outgrows its cap the counts become a FLOOR (silently
// truncated) — acceptable for an instructor dashboard, and each cap is far
// above realistic charity-platform scale. Rationale per cap:

/** DATA-MODEL "Catatan keamanan #3": lessons per course ≤ 200 by design. */
export const MAX_LESSONS_PER_COURSE = 200;

/** DATA-MODEL "Catatan keamanan #3": modules per course ≤ 30 by design. */
export const MAX_MODULES_PER_COURSE = 30;

/**
 * lessonCompletions.by_course scan ceiling (assignment #17 spec: "bounded
 * take ≤5000"). 5000 rows ≈ 25 members fully completing a max-size (200
 * lesson) course — beyond that, per-lesson counts floor at the cap.
 */
export const MAX_LESSON_COMPLETIONS_SCAN = 5000;

/**
 * memberships.by_tenant scan ceiling. Member count (and the badge count that
 * is derived per member — see aggregate.ts) floors at this many members.
 */
export const MAX_MEMBERSHIPS_SCAN = 1000;

/** quizAttempts.by_quiz scan ceiling — attempts/pass counts floor here. */
export const MAX_ATTEMPTS_PER_QUIZ_SCAN = 5000;

/**
 * quizzes.by_module read ceiling. The quiz builder enforces ONE quiz per
 * module, but analytics reads defensively (a small take, not .unique()) so a
 * violated invariant degrades to extra rows instead of a crashed dashboard.
 */
export const MAX_QUIZZES_PER_MODULE_SCAN = 5;

/** courses.by_tenant ceiling for the kelola summary list. */
export const MAX_COURSES_PER_TENANT = 100;

/**
 * courseCompletions.by_user read ceiling per member (one badge per completed
 * course, so this is "courses one user finished" — 200 matches the platform's
 * per-course lesson cap in spirit; nobody finishes 200 courses here).
 */
export const MAX_BADGES_PER_USER_SCAN = 200;
