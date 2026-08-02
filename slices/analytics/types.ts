// analytics slice — client types. Server-owned shapes/codes are re-exported
// from the convex feature so client and server share ONE SSOT (@convex/* is an
// allowed cross-slice path per rr-conventions "barrel-only imports"; the
// re-exports are type-only, nothing server-side reaches the client bundle).

/** getCourseAnalytics result — derived counts, no PII. */
export type { CourseAnalytics as CourseAnalyticsData } from "@convex/features/analytics/queries";
/** listCourseSummaries item — compact numbers for the kelola course list. */
export type { CourseSummary as CourseSummaryData } from "@convex/features/analytics/queries";
/** Row shapes rendered by the presentational components. */
export type {
  LessonCompletionStat,
  ModuleQuizStat,
} from "@convex/features/analytics/aggregate";
/** Typed error union thrown by the analytics feature. */
export type { AnalyticsErrorCode } from "@convex/features/analytics/errors";
