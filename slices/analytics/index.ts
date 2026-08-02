// analytics slice — public barrel (THE contract; barrel-only cross-slice
// imports, rr-conventions P1). STATUS row #17: read-only instructor+
// aggregates per course, deferred from #3. No routes: alpha mounts
// CourseAnalyticsView inside the kelola window-app; useCourseSummaries feeds
// the kelola course list its { completionCount, memberCount } numbers.
//
// Convex surface (not re-exported; call via api.features.analytics.*):
//   queries.getCourseAnalytics · queries.listCourseSummaries

// feature descriptor
export { analyticsFeature } from "./config";

// connected view (drop into the kelola window-app)
export { CourseAnalyticsView, type CourseAnalyticsViewProps } from "./views/course-analytics-view";

// presentational components (props-driven, portable)
export { StatCard, type StatCardProps } from "./components/stat-card";
export {
  LessonCompletionBars,
  type LessonCompletionBarsProps,
} from "./components/lesson-completion-bars";
export { QuizStatList, type QuizStatListProps } from "./components/quiz-stat-list";

// hooks (reads — analytics has no mutations)
export { useCourseAnalytics } from "./hooks/use-course-analytics";
export { useCourseSummaries } from "./hooks/use-course-summaries";

// lib (pure — safe for server or client)
export { analyticsErrorMessage, extractAnalyticsError } from "./lib/errors";

// copy (props-driven defaults)
export {
  ANALYTICS_COPY,
  mergeAnalyticsCopy,
  type AnalyticsCopy,
  type AnalyticsCopyOverride,
} from "./config/copy";

// types
export type {
  AnalyticsErrorCode,
  CourseAnalyticsData,
  CourseSummaryData,
  LessonCompletionStat,
  ModuleQuizStat,
} from "./types";
