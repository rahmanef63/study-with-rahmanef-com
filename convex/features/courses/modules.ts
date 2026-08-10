// courses feature — MODULES ARE RETIRED (DECISIONS #37).
//
// A course is an ordered list of materi (`courseLessons`), not a two-level
// tree: production had 30 modules for 75 lessons, 2.5 lessons each, carrying
// almost no information. The `modules` table and these mutations' writes are
// gone; the table itself is dropped by the integrator in step 3.
//
// KEPT AS THROWING STUBS, not deleted, on purpose: the instructor console and
// its hooks still reference `api.features.courses.modules.*` while the frontend
// migration lands, and a stale call must fail with a readable Bahasa Indonesia
// error instead of a missing-function crash. Signatures are unchanged so those
// callers keep type-checking until they are rewritten; every handler throws
// before touching ctx, so nothing is ever read or written here (P0: no data can
// leave a handler that never reaches the database).
//
// Replacements: manage.addLessonToCourse / removeLessonFromCourse /
// reorderCourseLessons operate on placements. Delete this file once
// `grep -rn "courses.modules" .` is empty.
import { v } from "convex/values";
import { mutation } from "../../_generated/server";
import { fail } from "./errors";

const RETIRED =
  "Modul sudah tidak dipakai — materi kini ditempatkan langsung di kelas. Muat ulang halaman kelola.";

/** @deprecated modules are retired — use lessons.createLesson + manage.addLessonToCourse. */
export const createModule = mutation({
  args: { courseId: v.id("courses"), title: v.string() },
  handler: async () => fail("VALIDATION_FAILED", RETIRED),
});

/** @deprecated modules are retired. */
export const renameModule = mutation({
  args: { moduleId: v.id("modules"), title: v.string() },
  handler: async () => fail("VALIDATION_FAILED", RETIRED),
});

/** @deprecated modules are retired — use manage.reorderCourseLessons. */
export const reorderModules = mutation({
  args: { courseId: v.id("courses"), orderedModuleIds: v.array(v.id("modules")) },
  handler: async () => fail("VALIDATION_FAILED", RETIRED),
});

/** @deprecated modules are retired. */
export const deleteModule = mutation({
  args: { moduleId: v.id("modules") },
  handler: async () => fail("VALIDATION_FAILED", RETIRED),
});
