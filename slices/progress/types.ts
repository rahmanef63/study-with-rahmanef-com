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

/** markLessonComplete result — idempotency + course-completion signal. */
export type MarkLessonCompleteResult = {
  lessonId: Id<"lessons">;
  wasAlreadyComplete: boolean;
  courseCompleted: boolean;
  completedCount: number;
  totalCount: number;
};
