// courses feature — module mutations (instructor+, R4: urutan bisa diatur).
// Deletion invariant (docs/DATA-MODEL.md): a module may only be deleted when
// it has no lessons — lessons are deleted one by one (each delete checks for
// completions), so member progress can never be corrupted from here.
import { v } from "convex/values";
import { mutation } from "../../_generated/server";
import { requireInstructorForCourse, requireInstructorForModule } from "./access";
import { fail } from "./errors";
import { assertTitle, MAX_MODULES_PER_COURSE } from "./validate";

export const createModule = mutation({
  args: { courseId: v.id("courses"), title: v.string() },
  handler: async (ctx, args) => {
    const { course } = await requireInstructorForCourse(ctx, args.courseId);
    assertTitle(args.title, "modul");

    const siblings = await ctx.db
      .query("modules")
      .withIndex("by_course", (q) => q.eq("courseId", course._id))
      .take(MAX_MODULES_PER_COURSE);
    if (siblings.length >= MAX_MODULES_PER_COURSE) {
      fail("VALIDATION_FAILED", `Maksimal ${MAX_MODULES_PER_COURSE} modul per kelas`);
    }
    const maxOrder = siblings.reduce((max, mod) => Math.max(max, mod.order), 0);

    return ctx.db.insert("modules", {
      tenantId: course.tenantId,
      courseId: course._id,
      title: args.title.trim(),
      order: maxOrder + 1,
    });
  },
});

export const renameModule = mutation({
  args: { moduleId: v.id("modules"), title: v.string() },
  handler: async (ctx, args) => {
    const { module: mod } = await requireInstructorForModule(ctx, args.moduleId);
    assertTitle(args.title, "modul");
    await ctx.db.patch(mod._id, { title: args.title.trim() });
    return mod._id;
  },
});

/**
 * Reorder ALL modules of a course in one call: orderedModuleIds must be a
 * permutation of the course's current module ids (validated — no cross-course
 * smuggling), order becomes the array position (1-based).
 */
export const reorderModules = mutation({
  args: { courseId: v.id("courses"), orderedModuleIds: v.array(v.id("modules")) },
  handler: async (ctx, args) => {
    const { course } = await requireInstructorForCourse(ctx, args.courseId);

    const current = await ctx.db
      .query("modules")
      .withIndex("by_course", (q) => q.eq("courseId", course._id))
      .take(MAX_MODULES_PER_COURSE);
    const currentIds = new Set(current.map((mod) => mod._id as string));
    const incoming = args.orderedModuleIds.map(String);
    if (
      incoming.length !== currentIds.size ||
      incoming.some((id) => !currentIds.has(id)) ||
      new Set(incoming).size !== incoming.length
    ) {
      fail("VALIDATION_FAILED", "Daftar modul tidak sesuai dengan isi kelas");
    }

    for (let i = 0; i < args.orderedModuleIds.length; i++) {
      await ctx.db.patch(args.orderedModuleIds[i], { order: i + 1 });
    }
    return course._id;
  },
});

/** Delete an EMPTY module only (see invariant at top of file). */
export const deleteModule = mutation({
  args: { moduleId: v.id("modules") },
  handler: async (ctx, args) => {
    const { module: mod } = await requireInstructorForModule(ctx, args.moduleId);
    const anyLesson = await ctx.db
      .query("lessons")
      .withIndex("by_module", (q) => q.eq("moduleId", mod._id))
      .first();
    if (anyLesson !== null) {
      fail("VALIDATION_FAILED", "Hapus atau pindahkan semua lesson di modul ini dulu");
    }
    await ctx.db.delete(mod._id);
    return mod._id;
  },
});
