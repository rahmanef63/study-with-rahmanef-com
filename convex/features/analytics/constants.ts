// analytics feature — by-design ceilings for every counting read (P1: no bare
// .collect(); every read is .withIndex(...).take(cap)). All analytics numbers
// are DERIVED on read, never stored (docs/DATA-MODEL.md "Derivasi & invarian").
// If a table ever outgrows its cap the counts become a FLOOR (silently
// truncated) — acceptable for an instructor dashboard, and each cap is far
// above realistic charity-platform scale. Rationale per cap:

/** DATA-MODEL "Catatan keamanan #3": materi per course ≤ 200 by design. */
export const MAX_LESSONS_PER_COURSE = 200;

/**
 * memberships.by_tenant scan ceiling. Member count (and both the badge count
 * and the per-materi completion count, which are derived per member — see
 * aggregate.ts) floors at this many members.
 */
export const MAX_MEMBERSHIPS_SCAN = 1000;

/**
 * lessonCompletions.by_user read ceiling PER MEMBER. Completion is keyed on
 * (userId, lessonId) now (DECISIONS #36/#37) and there is no by_lesson index,
 * so per-materi counts are bucketed from each member's own completions — the
 * same shape countBadgesByCourse already uses. 2000 = one learner finishing ten
 * max-size courses; past that their older rows stop being counted.
 */
export const MAX_COMPLETIONS_PER_USER_SCAN = 2000;

/** quizAttempts.by_quiz scan ceiling — attempts/pass counts floor here. */
export const MAX_ATTEMPTS_PER_QUIZ_SCAN = 5000;

/**
 * quizzes.by_course read ceiling. Quizzes hang off the COURSE now (the module
 * tree is retiring), so this is "kuis dalam satu kelas" — the builder makes few,
 * and analytics reads defensively so a surprise extra row degrades to an extra
 * card instead of a crashed dashboard.
 */
export const MAX_QUIZZES_PER_COURSE_SCAN = 50;

/** courses.by_tenant ceiling for the kelola summary list. */
export const MAX_COURSES_PER_TENANT = 100;

/**
 * courseCompletions.by_user read ceiling per member (one badge per completed
 * course, so this is "courses one user finished" — 200 matches the platform's
 * per-course materi cap in spirit; nobody finishes 200 courses here).
 */
export const MAX_BADGES_PER_USER_SCAN = 200;
