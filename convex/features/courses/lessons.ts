// courses feature — MATERI mutations (instructor+, R4).
// A materi belongs to the TENANT, not to a course: createLesson takes a
// tenantId and puts the materi in NO course. Placement is a separate, explicit
// act (manage.addLessonToCourse) — which is what lets one materi be taught by
// several courses at once (DECISIONS #36/#37).
// P0: youtubeVideoId validated as an 11-char ID inside the mutation — a full
// URL is rejected, preventing arbitrary embeds. Deletion respects the
// DATA-MODEL invariant: a materi with completions cannot be deleted.
import { v } from "convex/values";
import type { Id } from "../../_generated/dataModel";
import { mutation, type MutationCtx } from "../../_generated/server";
import { requireTenantRole } from "../../_shared/auth";
import { deleteMateriJoinRows, requireInstructorForLesson } from "./access";
import { fail } from "./errors";
import { isSlugFree, uniqueSlug } from "./slug";
import {
  assertContentMd,
  assertLinks,
  assertMateriSlug,
  assertTitle,
  assertYoutubeVideoId,
} from "./validate";

const linkValidator = v.object({ label: v.string(), url: v.string() });
const statusValidator = v.union(v.literal("draft"), v.literal("published"));

/** Slug the caller asked for, validated + proven free in the tenant. */
async function resolveSlug(
  ctx: MutationCtx,
  tenantId: Id<"tenants">,
  slug: string,
  exceptLessonId?: Id<"lessons">
): Promise<string> {
  assertMateriSlug(slug);
  if (!(await isSlugFree(ctx, tenantId, slug, exceptLessonId))) {
    fail("VALIDATION_FAILED", "Slug materi sudah dipakai di komunitas ini");
  }
  return slug;
}

/**
 * Create a standalone materi. It lands in NO course — add it to one with
 * manage.addLessonToCourse. `status` defaults to "published" so nothing
 * silently disappears from members the way a draft-by-default would; pass
 * "draft" to write it privately first.
 */
export const createLesson = mutation({
  args: {
    tenantId: v.id("tenants"),
    title: v.string(),
    contentMd: v.string(),
    slug: v.optional(v.string()),
    status: v.optional(statusValidator),
    youtubeVideoId: v.optional(v.string()),
    links: v.array(linkValidator),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireTenantRole(ctx, args.tenantId, "instructor");
    assertTitle(args.title, "materi");
    assertContentMd(args.contentMd);
    assertLinks(args.links);
    if (args.youtubeVideoId !== undefined) assertYoutubeVideoId(args.youtubeVideoId);
    const slug =
      args.slug === undefined
        ? await uniqueSlug(ctx, args.tenantId, args.title)
        : await resolveSlug(ctx, args.tenantId, args.slug);

    return ctx.db.insert("lessons", {
      tenantId: args.tenantId,
      title: args.title.trim(),
      slug,
      status: args.status ?? "published",
      authorId: userId,
      youtubeVideoId: args.youtubeVideoId,
      contentMd: args.contentMd,
      links: args.links,
    });
  },
});

export const updateLesson = mutation({
  args: {
    lessonId: v.id("lessons"),
    title: v.optional(v.string()),
    slug: v.optional(v.string()),
    contentMd: v.optional(v.string()),
    // null = remove the video; absent = leave untouched.
    youtubeVideoId: v.optional(v.union(v.string(), v.null())),
    links: v.optional(v.array(linkValidator)),
  },
  handler: async (ctx, args) => {
    const { lesson } = await requireInstructorForLesson(ctx, args.lessonId);

    const patch: Record<string, unknown> = {};
    if (args.title !== undefined) {
      assertTitle(args.title, "materi");
      patch.title = args.title.trim();
    }
    if (args.slug !== undefined) {
      patch.slug = await resolveSlug(ctx, lesson.tenantId, args.slug, lesson._id);
    }
    if (args.contentMd !== undefined) {
      // THE STORAGE INVARIANT (DECISIONS #38): where `contentBlocks` exists it
      // is canonical and `contentMd` is derived from it by
      // `features/materi/content.saveContent`. Patching the markdown here would
      // leave the blocks stale, and since the editor loads blocks first, the
      // next save would re-derive the markdown from them and silently throw
      // this edit away. One body, one write path — so refuse instead.
      if (lesson.contentBlocks !== undefined) {
        fail(
          "VALIDATION_FAILED",
          "Materi ini sudah pakai editor blok — ubah isinya lewat editor, bukan markdown"
        );
      }
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

/** Publish / unpublish a materi. Drafts stay visible to instructor+ only, in
 *  EVERY course that teaches them — status is a property of the materi. */
export const setLessonStatus = mutation({
  args: { lessonId: v.id("lessons"), status: statusValidator },
  handler: async (ctx, args) => {
    const { lesson } = await requireInstructorForLesson(ctx, args.lessonId);
    await ctx.db.patch(lesson._id, { status: args.status });
    return lesson._id;
  },
});

/**
 * Delete a materi ONLY if nobody has completed it (DATA-MODEL invariant —
 * otherwise unpublish it, or remove it from the course, instead). Deleting
 * cascades to the rows that only exist to point AT this materi: its placements,
 * its tags and its references. Everything else keeps its own lifecycle.
 *
 * Completion probe goes through `by_lesson`, NOT through the placements. A
 * materi taught by two courses records its completions with `courseId`
 * undefined (identity is (userId, lessonId); the column is provenance only), so
 * a placement-scoped probe is blind for precisely the shared materi this model
 * exists to support — and would let an instructor delete work members had
 * already finished.
 */
export const deleteLesson = mutation({
  args: { lessonId: v.id("lessons") },
  handler: async (ctx, args) => {
    const { lesson } = await requireInstructorForLesson(ctx, args.lessonId);

    const done = await ctx.db
      .query("lessonCompletions")
      .withIndex("by_lesson", (q) => q.eq("lessonId", lesson._id))
      .first();
    if (done !== null) {
      fail(
        "VALIDATION_FAILED",
        "Materi ini sudah diselesaikan member — jadikan draft alih-alih menghapus"
      );
    }

    await deleteMateriJoinRows(ctx, lesson._id);
    await ctx.db.delete(lesson._id);
    return lesson._id;
  },
});
