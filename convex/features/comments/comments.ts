// comments feature — write surface (#16 diskusi per lesson; widened v1.8 #29 so
// a comment can hang off a Diskusi POST instead). P0 contract per handler:
// v.* validators + authz helper on the FIRST line, auth BEFORE any by-ID read,
// tenantId always from the LESSON / POST / comment row (never from args).
import { v } from "convex/values";
import type { Id } from "../../_generated/dataModel";
import { mutation, type MutationCtx } from "../../_generated/server";
import { requireUser } from "../../_shared/auth";
import {
  assertExactlyOneTarget,
  assertRootParentOnLesson,
  assertRootParentOnPost,
  requireAuthorOrInstructorForComment,
  requireMemberForLesson,
  requireMemberForPost,
} from "./access";
import {
  assertUnderCommentLimit,
  assertUnderPostCommentLimit,
  countUserCommentsOnLesson,
  countUserCommentsOnPost,
} from "./antiSpam";
import { maybeSchedulePostCommentNotifications, maybeScheduleReplyNotification } from "./notify";
import { assertBody } from "./validate";

type AddArgs = { bodyMd: string; parentId?: Id<"comments"> };

/** Lesson branch — unchanged behaviour from #16. */
async function addOnLesson(
  ctx: MutationCtx,
  lessonId: Id<"lessons">,
  args: AddArgs
): Promise<Id<"comments">> {
  const { userId, lesson } = await requireMemberForLesson(ctx, lessonId);
  assertBody(args.bodyMd);
  if (args.parentId !== undefined) {
    await assertRootParentOnLesson(ctx, args.parentId, lessonId);
  }
  assertUnderCommentLimit(await countUserCommentsOnLesson(ctx, lessonId, userId));

  const commentId = await ctx.db.insert("comments", {
    tenantId: lesson.tenantId, // ALWAYS from the lesson row (P0)
    lessonId,
    userId,
    bodyMd: args.bodyMd.trim(),
    parentId: args.parentId,
  });
  if (args.parentId !== undefined) {
    await maybeScheduleReplyNotification(ctx, { parentId: args.parentId, lesson, replierId: userId });
  }
  return commentId;
}

/**
 * Post branch (v1.8 #29). The DENORMALISED counters are this mutation's
 * responsibility: `commentCount` and `lastActivityAt` are patched in the SAME
 * transaction as the insert, so the feed ordering and the badge can never drift
 * from the rows (DATA-MODEL invariant — nothing derives them).
 */
async function addOnPost(
  ctx: MutationCtx,
  postId: Id<"posts">,
  args: AddArgs
): Promise<Id<"comments">> {
  const { userId, post } = await requireMemberForPost(ctx, postId);
  assertBody(args.bodyMd);
  if (args.parentId !== undefined) {
    await assertRootParentOnPost(ctx, args.parentId, postId);
  }
  assertUnderPostCommentLimit(await countUserCommentsOnPost(ctx, postId, userId));

  const commentId = await ctx.db.insert("comments", {
    tenantId: post.tenantId, // ALWAYS from the post row (P0)
    postId,
    userId,
    bodyMd: args.bodyMd.trim(),
    parentId: args.parentId,
  });
  await ctx.db.patch(post._id, {
    commentCount: post.commentCount + 1,
    lastActivityAt: Date.now(),
  });
  await maybeSchedulePostCommentNotifications(ctx, {
    post,
    parentId: args.parentId,
    replierId: userId,
  });
  return commentId;
}

/**
 * Member of the target's tenant posts a comment (root) or a depth-1 reply on
 * EXACTLY ONE of a lesson or a Diskusi post:
 * - both targets or neither → VALIDATION_FAILED (the schema cannot say XOR);
 * - bodyMd 1..2000 chars after trim (assertBody);
 * - parentId, when present, must be a ROOT comment of the SAME target and not
 *   soft-deleted — otherwise VALIDATION_FAILED;
 * - anti-spam: RATE_LIMITED past the per-user-per-target cap (antiSpam.ts);
 * - notifications are fire-and-forget and never self-notify (notify.ts).
 */
export const addComment = mutation({
  args: {
    lessonId: v.optional(v.id("lessons")),
    postId: v.optional(v.id("posts")),
    bodyMd: v.string(),
    parentId: v.optional(v.id("comments")),
  },
  handler: async (ctx, args): Promise<Id<"comments">> => {
    await requireUser(ctx); // auth FIRST (P0) — before any by-ID read or arg probe
    const target = assertExactlyOneTarget(args);
    const rest: AddArgs = { bodyMd: args.bodyMd, parentId: args.parentId };
    return target.kind === "post"
      ? addOnPost(ctx, target.postId, rest)
      : addOnLesson(ctx, target.lessonId, rest);
  },
});

/**
 * Soft delete — author OR instructor+ of the comment's tenant. Sets deletedAt;
 * the row is NEVER hard-deleted (replies keep their anchor; reads project a
 * placeholder). Idempotent: deleting an already-deleted comment is a no-op.
 * The post's `commentCount` is intentionally NOT decremented — the row still
 * occupies a slot in the thread as a placeholder, so the badge keeps matching
 * what a reader actually sees.
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
