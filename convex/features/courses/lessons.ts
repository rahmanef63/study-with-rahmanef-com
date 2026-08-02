// courses feature — lesson mutations (instructor+, R4).
// P0: youtubeVideoId validated as an 11-char ID inside the mutation — a full
// URL is rejected, preventing arbitrary embeds. Deletion respects the
// DATA-MODEL invariant: a lesson with completions cannot be deleted.
import { v } from "convex/values";
import { mutation } from "../../_generated/server";
import { requireInstructorForLesson, requireInstructorForModule } from "./access";
import { fail } from "./errors";
import {
  assertContentMd,
  assertLinks,
  assertTitle,
  assertYoutubeVideoId,
  MAX_LESSONS_PER_COURSE,
} from "./validate";

const linkValidator = v.object({ label: v.string(), url: v.string() });

export const createLesson = mutation({
  args: {
    moduleId: v.id("modules"),
    title: v.string(),
    contentMd: v.string(),
    youtubeVideoId: v.optional(v.string()),
    links: v.array(linkValidator),
  },
  handler: async (ctx, args) => {
    const { module: mod } = await requireInstructorForModule(ctx, args.moduleId);
    assertTitle(args.title, "lesson");
    assertContentMd(args.contentMd);
    assertLinks(args.links);
    if (args.youtubeVideoId !== undefined) assertYoutubeVideoId(args.youtubeVideoId);

    const courseLessons = await ctx.db
      .query("lessons")
      .withIndex("by_course", (q) => q.eq("courseId", mod.courseId))
      .take(MAX_LESSONS_PER_COURSE);
    if (courseLessons.length >= MAX_LESSONS_PER_COURSE) {
      fail("VALIDATION_FAILED", `Maksimal ${MAX_LESSONS_PER_COURSE} lesson per kelas`);
    }
    const maxOrder = courseLessons
      .filter((lesson) => lesson.moduleId === mod._id)
      .reduce((max, lesson) => Math.max(max, lesson.order), 0);

    return ctx.db.insert("lessons", {
      tenantId: mod.tenantId,
      courseId: mod.courseId,
      moduleId: mod._id,
      title: args.title.trim(),
      youtubeVideoId: args.youtubeVideoId,
      contentMd: args.contentMd,
      links: args.links,
      order: maxOrder + 1,
    });
  },
});

export const updateLesson = mutation({
  args: {
    lessonId: v.id("lessons"),
    title: v.optional(v.string()),
    contentMd: v.optional(v.string()),
    // null = remove the video; absent = leave untouched.
    youtubeVideoId: v.optional(v.union(v.string(), v.null())),
    links: v.optional(v.array(linkValidator)),
  },
  handler: async (ctx, args) => {
    const { lesson } = await requireInstructorForLesson(ctx, args.lessonId);

    const patch: Record<string, unknown> = {};
    if (args.title !== undefined) {
      assertTitle(args.title, "lesson");
      patch.title = args.title.trim();
    }
    if (args.contentMd !== undefined) {
      assertContentMd(args.contentMd);
      patch.contentMd = args.contentMd;
    }
    if (args.youtubeVideoId !== undefined) {
      if (args.youtubeVideoId === null) {
        patch.youtubeVideoId = undefined; // clears the optional field
      } else {
        assertYoutubeVideoId(args.youtubeVideoId);
        patch.youtubeVideoId = args.youtubeVideoId;
      }
    }
    if (args.links !== undefined) {
      assertLinks(args.links);
      patch.links = args.links;
    }
    if (Object.keys(patch).length === 0) {
      fail("VALIDATION_FAILED", "Tidak ada perubahan untuk disimpan");
    }
    await ctx.db.patch(lesson._id, patch);
    return lesson._id;
  },
});

/** Reorder lessons WITHIN a module (permutation-validated, 1-based order). */
export const reorderLessons = mutation({
  args: { moduleId: v.id("modules"), orderedLessonIds: v.array(v.id("lessons")) },
  handler: async (ctx, args) => {
    const { module: mod } = await requireInstructorForModule(ctx, args.moduleId);

    const current = await ctx.db
      .query("lessons")
      .withIndex("by_module", (q) => q.eq("moduleId", mod._id))
      .take(MAX_LESSONS_PER_COURSE);
    const currentIds = new Set(current.map((lesson) => lesson._id as string));
    const incoming = args.orderedLessonIds.map(String);
    if (
      incoming.length !== currentIds.size ||
      incoming.some((id) => !currentIds.has(id)) ||
      new Set(incoming).size !== incoming.length
    ) {
      fail("VALIDATION_FAILED", "Daftar lesson tidak sesuai dengan isi modul");
    }

    for (let i = 0; i < args.orderedLessonIds.length; i++) {
      await ctx.db.patch(args.orderedLessonIds[i], { order: i + 1 });
    }
    return mod._id;
  },
});

/**
 * Delete a lesson ONLY if nobody has completed it (DATA-MODEL invariant —
 * otherwise archive the course instead). Completion probe: by_course index
 * then in-range filter on lessonId, .first() short-circuits.
 * TODO(rr): propose a lessonCompletions `by_lesson` index to the integrator
 * if course-level completion volume ever makes this probe slow (schema is
 * DATA-MODEL SSOT — change needs the doc updated first).
 */
export const deleteLesson = mutation({
  args: { lessonId: v.id("lessons") },
  handler: async (ctx, args) => {
    const { lesson } = await requireInstructorForLesson(ctx, args.lessonId);
    const anyCompletion = await ctx.db
      .query("lessonCompletions")
      .withIndex("by_course", (q) => q.eq("courseId", lesson.courseId))
      .filter((q) => q.eq(q.field("lessonId"), lesson._id))
      .first();
    if (anyCompletion !== null) {
      fail(
        "VALIDATION_FAILED",
        "Lesson ini sudah diselesaikan member — arsipkan kelas alih-alih menghapus"
      );
    }
    await ctx.db.delete(lesson._id);
    return lesson._id;
  },
});
