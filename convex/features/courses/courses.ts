// courses feature — course-level mutations (instructor+, R4).
// P0 contract per handler: v.* validators + authz before any write.
// Slug uniqueness is per tenant via by_tenant_slug (docs/DATA-MODEL.md).
import { v } from "convex/values";
import type { Id } from "../../_generated/dataModel";
import { mutation, type MutationCtx } from "../../_generated/server";
import { requireTenantRole } from "../../_shared/auth";
import { requireInstructorForCourse } from "./access";
import { fail } from "./errors";
import {
  assertCourseSlug,
  assertCoverImageUrl,
  assertDescription,
  assertTitle,
} from "./validate";

async function assertSlugFree(
  ctx: MutationCtx,
  tenantId: Id<"tenants">,
  slug: string,
  exceptCourseId?: Id<"courses">
): Promise<void> {
  const existing = await ctx.db
    .query("courses")
    .withIndex("by_tenant_slug", (q) => q.eq("tenantId", tenantId).eq("slug", slug))
    .unique();
  if (existing !== null && existing._id !== exceptCourseId) {
    fail("VALIDATION_FAILED", "Slug kelas sudah dipakai di komunitas ini");
  }
}

/** Create a course — starts as DRAFT (invisible to members until published). */
export const create = mutation({
  args: {
    tenantId: v.id("tenants"),
    slug: v.string(),
    title: v.string(),
    description: v.string(),
    coverImageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireTenantRole(ctx, args.tenantId, "instructor");
    assertCourseSlug(args.slug);
    assertTitle(args.title, "kelas");
    assertDescription(args.description);
    if (args.coverImageUrl !== undefined) assertCoverImageUrl(args.coverImageUrl);
    await assertSlugFree(ctx, args.tenantId, args.slug);

    return ctx.db.insert("courses", {
      tenantId: args.tenantId,
      slug: args.slug,
      title: args.title.trim(),
      description: args.description.trim(),
      coverImageUrl: args.coverImageUrl,
      status: "draft",
      createdBy: userId,
    });
  },
});

/** Update course profile fields (not status — see setStatus). */
export const update = mutation({
  args: {
    courseId: v.id("courses"),
    slug: v.optional(v.string()),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    // null = clear the cover; absent = leave untouched.
    coverImageUrl: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, args) => {
    const { course } = await requireInstructorForCourse(ctx, args.courseId);

    const patch: Record<string, unknown> = {};
    if (args.slug !== undefined) {
      assertCourseSlug(args.slug);
      await assertSlugFree(ctx, course.tenantId, args.slug, course._id);
      patch.slug = args.slug;
    }
    if (args.title !== undefined) {
      assertTitle(args.title, "kelas");
      patch.title = args.title.trim();
    }
    if (args.description !== undefined) {
      assertDescription(args.description);
      patch.description = args.description.trim();
    }
    if (args.coverImageUrl !== undefined) {
      if (args.coverImageUrl === null) {
        patch.coverImageUrl = undefined; // clears the optional field
      } else {
        assertCoverImageUrl(args.coverImageUrl);
        patch.coverImageUrl = args.coverImageUrl;
      }
    }
    if (Object.keys(patch).length === 0) {
      fail("VALIDATION_FAILED", "Tidak ada perubahan untuk disimpan");
    }
    await ctx.db.patch(course._id, patch);
    return course._id;
  },
});

/**
 * Status transitions: draft ↔ published → archived.
 * Publishing requires ≥1 lesson (empty-course footgun guard) — single
 * indexed .first() probe, bounded.
 */
export const setStatus = mutation({
  args: {
    courseId: v.id("courses"),
    status: v.union(v.literal("draft"), v.literal("published"), v.literal("archived")),
  },
  handler: async (ctx, args) => {
    const { course } = await requireInstructorForCourse(ctx, args.courseId);
    if (args.status === "published" && course.status !== "published") {
      const anyLesson = await ctx.db
        .query("lessons")
        .withIndex("by_course", (q) => q.eq("courseId", course._id))
        .first();
      if (anyLesson === null) {
        fail("VALIDATION_FAILED", "Tambahkan minimal satu lesson sebelum menerbitkan kelas");
      }
    }
    await ctx.db.patch(course._id, { status: args.status });
    return course._id;
  },
});
