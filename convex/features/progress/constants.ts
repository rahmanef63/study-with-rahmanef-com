// progress feature — by-design bounds for counting reads (no bare .collect();
// docs/DATA-MODEL.md "Catatan keamanan #3": lessons per course ≤ 200).
// Re-declared locally on purpose: progress must NOT deep-import the courses
// feature — cross-slice coupling resolves through shared tables only
// (docs/AGENT-PROMPTS.md epsilon: "Consume courses ONLY through its barrel").
// If DATA-MODEL raises the lesson cap, the integrator updates both slices.
export const MAX_LESSONS_PER_COURSE = 200;

/** A user can complete at most one row per lesson, so completions ≤ lessons. */
export const MAX_COMPLETIONS_PER_COURSE = MAX_LESSONS_PER_COURSE;

/**
 * How many courses one materi may be placed in (courseLessons.by_lesson).
 * Reuse is the point of the materi model — "sub agents" sits in Claude Code AND
 * Hermes — but a single page belonging to dozens of courses is a data defect,
 * not a use case, so the backlink read stays small and bounded.
 */
export const MAX_COURSES_PER_LESSON = 20;
