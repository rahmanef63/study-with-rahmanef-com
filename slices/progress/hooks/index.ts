// progress slice — hooks sub-barrel (re-exports only), a LIGHT public entry
// beside the full barrel (../index.ts). Eager OS-shell chrome (learning
// widgets' "Lanjutkan belajar") imports from here so the barrel's views never
// enter the initial JS chunk (see docs/SLICES.md "Light entries").
export { useCourseProgress } from "./use-course-progress";
export { useLessonCompletion } from "./use-lesson-completion";
export { useMarkLessonComplete } from "./use-progress-mutations";
export { useRecentCourses, type RecentCourseItem } from "./use-recent-courses";
