// progress slice — public barrel (THE contract; barrel-only cross-slice
// imports, rr-conventions P1). This slice has no routes: it fills the courses
// barrel seams for STATUS row #3 —
//   LessonView.completionSlot   ← <LessonCompletion lessonId={…} />
//   CourseOverview.progressSlot ← <CourseProgress courseId={…} />
//   SyllabusList.completedLessonIds ← useCourseProgress(courseId).completedLessonIds
// Row #9 (badge wall) reads courseCompletions, written idempotently here.
//
// Convex surface (not re-exported; call via api.features.progress.*):
//   mutations.markLessonComplete · queries.getCourseProgress ·
//   queries.getLessonCompletion

// feature descriptor
export { progressFeature } from "./config";

// presentational components (props-driven, portable)
export { CourseProgressBar, type CourseProgressBarProps } from "./components/course-progress-bar";
export { CompletionButton, type CompletionButtonProps } from "./components/completion-button";

// connected views (drop into the courses slots)
export { CourseProgress, type CourseProgressProps } from "./views/course-progress";
export { LessonCompletion, type LessonCompletionProps } from "./views/lesson-completion";

// hooks (reads + write)
export { useCourseProgress } from "./hooks/use-course-progress";
export { useLessonCompletion } from "./hooks/use-lesson-completion";
export { useMarkLessonComplete } from "./hooks/use-progress-mutations";

// lib (pure — safe for server or client)
export { toPercent } from "./lib/percent";
export { progressErrorMessage, extractProgressError } from "./lib/errors";

// copy (props-driven defaults)
export {
  PROGRESS_COPY,
  mergeProgressCopy,
  type ProgressCopy,
  type ProgressCopyOverride,
} from "./config/copy";

// types
export type {
  CourseProgressData,
  LessonCompletionData,
  MarkLessonCompleteResult,
  ProgressErrorCode,
} from "./types";
