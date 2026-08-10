// progress slice — client types. Server-owned shapes/codes are re-exported from
// the convex feature so client and server share ONE SSOT (@convex/* is an
// allowed cross-slice path per rr-conventions "barrel-only imports"; the
// re-exports are type-only, nothing server-side reaches the client bundle).
import type { Id } from "@convex/_generated/dataModel";

/** getCourseProgress result — derived counts + completed lesson ids. */
export type { CourseProgress as CourseProgressData } from "@convex/features/progress/derive";
/** Typed error union thrown by the progress feature. */
export type { ProgressErrorCode } from "@convex/features/progress/errors";

/** getLessonCompletion result — the caller's own boolean for one lesson. */
export type LessonCompletionData = { isCompleted: boolean };

/** Per-course numbers for ONE course the completed materi is taught in. */
export type MarkLessonCompleteCourseOutcome = {
  courseId: Id<"courses">;
  completedCount: number;
  totalCount: number;
  isComplete: boolean;
};

/**
 * markLessonComplete result — idempotency + course-completion signal.
 *
 * There are no flat `completedCount`/`totalCount` here on purpose: a materi can
 * sit in several courses (completion identity is (userId, lessonId)), so one
 * call can settle progress in more than one course and a single pair of numbers
 * has no honest value. Read `courses[]` instead; `courseCompleted` stays as the
 * "did ANY course just finish" toast signal.
 */
export type MarkLessonCompleteResult = {
  lessonId: Id<"lessons">;
  wasAlreadyComplete: boolean;
  courseCompleted: boolean;
  courses: MarkLessonCompleteCourseOutcome[];
};
