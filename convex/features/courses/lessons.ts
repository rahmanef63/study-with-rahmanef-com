// courses feature — MATERI mutations (instructor+, R4). A materi belongs to the
// TENANT, not to a course: createLesson takes a tenantId and puts the materi in
// NO course. Placement is a separate, explicit act (manage.addLessonToCourse) —
// which is what lets one materi be taught by several courses at once
// (DECISIONS #36/#37). A SKILL is one of these rows with `kind: "skill"`.
// P0: youtubeVideoId is validated as an 11-char ID here (a full URL is rejected,
// preventing arbitrary embeds); a materi with completions cannot be deleted.
import { v } from "convex/values";
import type { Id } from "../../_generated/dataModel";
import { mutation, type MutationCtx } from "../../_generated/server";
import { requireTenantRole } from "../../_shared/auth";
import { deleteMateriJoinRows, requireInstructorForLesson } from "./access";
import { fail } from "./errors";
import { isSlugFree, uniqueSlug } from "./slug";
// The prompt cap is a read-cost bound on the skills library, so it lives with
// the rest of the materi bounds and is imported, not copied — one cap, one
// message. Cross-feature helper import precedent: features/comments/notify.ts.
import { assertPromptText } from "../materi/validate";
import {
  assertContentMd,
  assertLinks,
  assertMateriSlug,
  assertTitle,
  assertYoutubeVideoId,
} from "./validate";

const linkValidator = v.object({ label: v.string(), url: v.string() });
const statusValidator = v.union(v.literal("draft"), v.literal("published"));
const kindValidator = v.union(v.literal("materi"), v.literal("skill"));

/** Slug the caller asked for: validated + proven free in the tenant. */
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
 *
 * `kind: "skill"` makes it a SKILL: same row, same tags, same permalink, plus a
 * `promptText`. Absent means "materi" and leaves the column UNWRITTEN, matching
 * the 76 rows that predate it — only skills need to say so, because only the
 * skills library is an exact index range. Placement stays orthogonal.
 */
export const createLesson = mutation({
  args: {
    tenantId: v.id("tenants"),
    title: v.string(),
    contentMd: v.string(),
    slug: v.optional(v.string()),
    status: v.optional(statusValidator),
    kind: v.optional(kindValidator),
    promptText: v.optional(v.string()),
    youtubeVideoId: v.optional(v.string()),
    links: v.array(linkValidator),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireTenantRole(ctx, args.tenantId, "instructor");
    assertTitle(args.title, "materi");
    assertContentMd(args.contentMd);
    assertLinks(args.links);
    if (args.youtubeVideoId !== undefined) assertYoutubeVideoId(args.youtubeVideoId);
    const prompt = args.promptText;
    const promptText = prompt === undefined ? undefined : assertPromptText(prompt, args.kind);
    const slug =
      args.slug === undefined
        ? await uniqueSlug(ctx, args.tenantId, args.title)
        : await resolveSlug(ctx, args.tenantId, args.slug);

    return ctx.db.insert("lessons", {
      tenantId: args.tenantId,
      title: args.title.trim(),
      slug,
      status: args.status ?? "published",
      kind: args.kind,
      promptText,
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
    // null = clear the prompt; absent = leave untouched. `kind` is deliberately
    // NOT updatable: flipping it moves a row between two libraries silently.
    promptText: v.optional(v.union(v.string(), v.null())),
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
      // THE STORAGE INVARIANT (DECISIONS #38): where `contentBlocks` exists it is
      // canonical and `contentMd` is derived from it by materi/content
      // .saveContent. Patching markdown here leaves the blocks stale, and the
      // editor's next save re-derives from them and eats this edit — so refuse.
      if (lesson.contentBlocks !== undefined) {
        fail(
          "VALIDATION_FAILED",
          "Materi ini sudah pakai editor blok — ubah isinya lewat editor, bukan markdown"
        );
      }
      assertContentMd(args.contentMd);
      patch.contentMd = args.contentMd;
    }
    if (args.promptText !== undefined) {
      // The row's OWN kind decides: no growing a prompt on a materi by claim.
      patch.promptText =
        args.promptText === null ? undefined : assertPromptText(args.promptText, lesson.kind);
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

/** Publish / unpublish. Drafts stay instructor+ only in EVERY course that
 *  teaches them — status is a property of the materi, not of a placement. */
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
 * otherwise unpublish it, or remove it from the course). Deleting cascades to
 * the rows that only exist to point AT this materi: placements, tags, refs.
 * The completion probe goes through `by_lesson`, NOT through the placements: a
 * materi taught by two courses records completions with `courseId` undefined
 * (identity is (userId, lessonId)), so a placement-scoped probe is blind for
 * precisely the shared materi this model exists to support — and would let an
 * instructor delete work members had already finished.
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
