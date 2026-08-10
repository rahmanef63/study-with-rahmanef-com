// Accessors for the legacy lesson-ownership columns, during the materi
// migration (DECISIONS #36/#37).
//
// `lessons.courseId`, `.moduleId` and `.order` became OPTIONAL in the schema so
// that a materi can exist without belonging to any course — but every row
// written so far still has them, and every mutation still writes them, until
// step 2 moves the writes onto `courseLessons`.
//
// The point of this module is that the assumption lives in ONE place instead of
// as 28 scattered `?? 0`s and non-null assertions. When step 3 deletes the
// columns, `grep -rn legacyLesson convex/` is the exact list of readers that
// still have to move. Deleting this file is the definition of "migration done".
import { ConvexError } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";

function required<T>(value: T | undefined, field: string, id: string): T {
  if (value === undefined) {
    // Not user-facing: reaching this means a materi with no legacy placement
    // was handed to a reader that has not been migrated yet, which is a
    // sequencing bug in our rollout, not something a caller did wrong.
    throw new ConvexError({
      code: "VALIDATION_FAILED",
      message: `Materi ${id} belum punya penempatan kelas (${field}).`,
    });
  }
  return value;
}

/** The course a legacy lesson belongs to. Throws if the row has been migrated
 *  off the tree but its reader has not. */
export const legacyCourseId = (lesson: Doc<"lessons">): Id<"courses"> =>
  required(lesson.courseId, "courseId", lesson._id);

/** The module a legacy lesson belongs to. */
export const legacyModuleId = (lesson: Doc<"lessons">): Id<"modules"> =>
  required(lesson.moduleId, "moduleId", lesson._id);

/** Sort position within its module. Unplaced materi sort first, which is the
 *  harmless outcome — order is presentation, never identity. */
export const legacyOrder = (lesson: { order?: number }): number => lesson.order ?? 0;

/** A row with no `status` predates the column and was, by definition, visible —
 *  drafts were a course-level concept before materi became standalone. */
export const isPublishedLesson = (lesson: Doc<"lessons">): boolean =>
  (lesson.status ?? "published") === "published";
