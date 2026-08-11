// analytics slice — client types. Server-owned shapes/codes are re-exported
// from the convex feature so client and server share ONE SSOT (@convex/* is an
// allowed cross-slice path per rr-conventions "barrel-only imports"; the
// re-exports are type-only, nothing server-side reaches the client bundle).
//
// MATERI MODEL (DECISIONS #36/#37): the module tree is gone. A course is a FLAT
// ordered list of materi (`courseLessons` placements) and a quiz hangs off the
// COURSE, so `LessonCompletionStat` carries no module fields and the quiz row
// is `CourseQuizStat` (was `ModuleQuizStat`).

/** getCourseAnalytics result — derived counts, no PII. */
export type { CourseAnalytics as CourseAnalyticsData } from "@convex/features/analytics/queries";
/** listCourseSummaries item — compact numbers for the kelola course list. */
export type { CourseSummary as CourseSummaryData } from "@convex/features/analytics/queries";
/** Row shapes rendered by the presentational components. */
export type {
  LessonCompletionStat,
  CourseQuizStat,
} from "@convex/features/analytics/aggregate";
/** Typed error union thrown by the analytics feature. */
export type { AnalyticsErrorCode } from "@convex/features/analytics/errors";

// ---- insight feature (0.3.0) ----------------------------------------------
// A SECOND convex feature behind one client slice, on purpose. `analytics`
// answers "how much" (completions, quiz pass rates) and `insight` answers "who
// read what" (views, drop-off, weekly pulse). They are separate backends
// because they own different tables; they are ONE slice because they are one
// screen — Kelola › Statistik — and splitting the UI would make an instructor
// cross-reference two lists of the same materi by eye.
//
// TERMINOLOGY THE UI MUST NOT BLUR: `viewedCount` is DISTINCT MEMBERS,
// `viewCount` is member-days. Anonymous reads are not counted at all.

/** courseFunnel result — the drop-off, per materi, in teaching order. */
export type { CourseFunnel as CourseFunnelData } from "@convex/features/insight/funnel";
/** One materi's step in that funnel. */
export type { FunnelStep as FunnelStepData } from "@convex/features/insight/funnel";
/** tenantPulse result — six numbers and two short lists for one community. */
export type { TenantPulse as TenantPulseData } from "@convex/features/insight/pulse";
/** A named materi in the read distribution (mostRead / leastRead). */
export type { PulseMateri as PulseMateriData } from "@convex/features/insight/pulse";
