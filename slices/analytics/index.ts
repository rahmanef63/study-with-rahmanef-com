// analytics slice — public barrel (THE contract; barrel-only cross-slice
// imports, rr-conventions P1). STATUS row #17: read-only instructor+
// aggregates per course, deferred from #3. No routes: the Kelola › Statistik
// tab mounts CourseAnalyticsView; useCourseSummaries feeds that tab's course
// list its { completionCount, memberCount } numbers.
//
// 0.2.0 (DECISIONS #37): the per-module grouping is gone. Completion bars are a
// FLAT per-materi list in teaching order and `ModuleQuizStat` is now
// `CourseQuizStat` — a quiz belongs to the course.
//
// 0.3.0 (2026-08-11): reader counts. The slice now spans TWO convex features —
// `analytics` (how much: completions, quiz pass rates) and `insight` (who read
// what: views, drop-off, weekly pulse). One slice because it is one screen; see
// ./types.ts for the argument. New surface:
//   · CourseFunnelView   — where readers stop, per course
//   · TenantPulseView    — the community's week + its read distribution
//   · MateriViewRecorder — the write side; mount it on a reading surface
//   · biggestDrop / lostBefore / funnelEnds — the pure drop-off arithmetic
//
// EVERY reader number in here counts LOGGED-IN MEMBERS ONLY, once per materi
// per day. Anonymous reads are invisible. `MembersOnlyNote` exists so that
// qualifier ships with the numbers rather than living in a comment; do not
// render a view count without it.
//
// Convex surface (not re-exported; call via api.features.*):
//   analytics/queries.getCourseAnalytics · analytics/queries.listCourseSummaries
//   insight/funnel.courseFunnel · insight/pulse.tenantPulse · insight/views.recordView

// feature descriptor
export { analyticsFeature } from "./config";

// connected views (drop into the Kelola › Statistik tab)
export { CourseAnalyticsView, type CourseAnalyticsViewProps } from "./views/course-analytics-view";
export { CourseFunnelView, type CourseFunnelViewProps } from "./views/course-funnel-view";
export { TenantPulseView, type TenantPulseViewProps } from "./views/tenant-pulse-view";

// presentational components (props-driven, portable)
export { StatCard, type StatCardProps } from "./components/stat-card";
// Completions-only bars. NOT used by CourseAnalyticsView any more — FunnelStepList
// renders the same materi with reads AND completions, so showing both would be the
// same list twice. Kept exported because it is the right component for a consumer
// that has the `analytics` feature without `insight`, and because it needs no
// members-only caveat: a completion is a completion.
export {
  LessonCompletionBars,
  type LessonCompletionBarsProps,
} from "./components/lesson-completion-bars";
export { QuizStatList, type QuizStatListProps } from "./components/quiz-stat-list";
export { FunnelStepList, type FunnelStepListProps } from "./components/funnel-step-list";
export { PulseMateriList, type PulseMateriListProps } from "./components/pulse-materi-list";
export { MembersOnlyNote, type MembersOnlyNoteProps } from "./components/members-only-note";
// Renders nothing; mount on a materi/skill reading surface. Its own header
// documents the once-per-view / never-on-prefetch / never-blocking contract.
export {
  MateriViewRecorder,
  type MateriViewRecorderProps,
} from "./components/materi-view-recorder";

// hooks (reads — the only write in this slice is MateriViewRecorder's)
export { useCourseAnalytics } from "./hooks/use-course-analytics";
export { useCourseSummaries } from "./hooks/use-course-summaries";
export { useCourseFunnel, useTenantPulse } from "./hooks/use-insight";

// lib (pure — safe for server or client)
export { analyticsErrorMessage, extractAnalyticsError } from "./lib/errors";
export { biggestDrop, funnelEnds, lostBefore, type DropOff } from "./lib/dropoff";

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
  CourseFunnelData,
  CourseQuizStat,
  CourseSummaryData,
  FunnelStepData,
  LessonCompletionStat,
  PulseMateriData,
  TenantPulseData,
} from "./types";
