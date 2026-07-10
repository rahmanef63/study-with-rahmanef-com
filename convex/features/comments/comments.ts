// comments feature — write surface (#16, diskusi per lesson). P0 contract per
// handler: v.* validators + authz helper on the FIRST line, auth BEFORE any
// by-ID read, tenantId always from the LESSON/comment row (never from args).
import { v } from "convex/values";
import { mutation } from "../../_generated/server";
import {
  assertRootParentOnLesson,
  requireAuthorOrInstructorForComment,
  requireMemberForLesson,
} from "./access";
import { assertUnderCommentLimit, countUserCommentsOnLesson } from "./antiSpam";
import { assertBody } from "./validate";

/**
 * Member of the lesson's tenant posts a comment (root) or a depth-1 reply.
 * - bodyMd 1..2000 chars after trim (assertBody);
 * - parentId, when present, must be a ROOT comment of the SAME lesson and not
 *   soft-deleted — otherwise VALIDATION_FAILED (assertRootParentOnLesson);
 * - anti-spam: RATE_LIMITED past the per-user-per-lesson cap (antiSpam.ts).
 */
export const addComment = mutation({
  args: {
    lessonId: v.id("lessons"),
    bodyMd: v.string(),
    parentId: v.optional(v.id("comments")),
  },
  handler: async (ctx, args) => {
    const { userId, lesson } = await requireMemberForLesson(ctx, args.lessonId);
    assertBody(args.bodyMd);
    if (args.parentId !== undefined) {
      await assertRootParentOnLesson(ctx, args.parentId, args.lessonId);
    }
    assertUnderCommentLimit(await countUserCommentsOnLesson(ctx, args.lessonId, userId));

    return ctx.db.insert("comments", {
      tenantId: lesson.tenantId, // ALWAYS from the lesson row (P0)
      lessonId: args.lessonId,
      userId,
      bodyMd: args.bodyMd.trim(),
      parentId: args.parentId,
    });
  },
});

/**
 * Soft delete — author OR instructor+ of the comment's tenant. Sets deletedAt;
 * the row is NEVER hard-deleted (replies keep their anchor; reads project a
 * placeholder). Idempotent: deleting an already-deleted comment is a no-op.
 */
export const softDelete = mutation({
  args: { commentId: v.id("comments") },
  handler: async (ctx, args) => {
    const { comment } = await requireAuthorOrInstructorForComment(ctx, args.commentId);
    if (comment.deletedAt === undefined) {
      await ctx.db.patch(comment._id, { deletedAt: Date.now() });
    }
    return comment._id;
  },
});
