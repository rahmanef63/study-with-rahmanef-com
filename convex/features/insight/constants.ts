// insight feature — by-design ceilings. P0: no bare `.collect()`; every read is
// `.withIndex(...).take(cap)`. Past a cap a number becomes a FLOOR (silently
// truncated) rather than an error — an instructor dashboard that under-reports
// is useful; one that throws is not. Every cap below is far above realistic
// scale for this platform (8 users, 128 materi as of 2026-08).
//
// Re-declared locally on purpose: insight must NOT deep-import another feature
// (AGENTS.md §4 — cross-slice needs resolve through barrels, and shared TABLES
// are the only sanctioned coupling). If DATA-MODEL raises a cap, both copies
// move together via the integrator.

/** DATA-MODEL "Catatan keamanan #3" / "Batas": materi per kelas ≤ 200. */
export const MAX_LESSONS_PER_COURSE = 200;

/** DATA-MODEL "Batas": sitemap ≤ 1000 materi per tenant — the same ceiling. */
export const MAX_LESSONS_PER_TENANT_SCAN = 1000;

/** memberships.by_tenant ceiling. Member count floors here. */
export const MAX_MEMBERSHIPS_SCAN = 1000;

/**
 * lessonCompletions.by_user ceiling PER MEMBER. Completion is keyed on
 * (userId, lessonId) and there is no by_tenant index, so tenant completion
 * counts are bucketed from each member's own rows — the shape
 * features/analytics/aggregate.ts already uses. 2000 = one learner finishing
 * ten max-size courses.
 */
export const MAX_COMPLETIONS_PER_USER_SCAN = 2000;

/**
 * materiViews.by_tenant_day ceiling for the 7-day active-learner scan. One row
 * per member per materi per day, so 5000 is ~700 member-materi pairs a day for
 * a week — an order of magnitude past anything this community produces.
 */
export const MAX_WEEK_VIEW_ROWS_SCAN = 5000;

/** materiViewCounts.by_tenant_lesson ceiling — one row per materi ever viewed. */
export const MAX_VIEW_COUNT_ROWS_SCAN = MAX_LESSONS_PER_TENANT_SCAN;

/** How many materi tenantPulse names on each end of the read distribution. */
export const PULSE_TOP_N = 5;

// ---- learnerProfiles input bounds (saveProfile) ----------------------------
// The assessment is a short questionnaire, not a form builder. These caps exist
// so one authenticated caller cannot park an arbitrary blob in the database.

/** Questions in the assessment. 24 is roughly 3× the intended length. */
export const MAX_ANSWERS = 24;

/** Recommended paths in one plan. More than a handful is not a plan. */
export const MAX_PATH_SLUGS = 12;

/** Character ceiling for any single questionId / optionId / path slug. */
export const MAX_SLUG_LENGTH = 64;
