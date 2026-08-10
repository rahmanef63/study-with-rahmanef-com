// comments feature — producer hook #1 for notifications (#21, wave v1.3):
// comment_reply. Called from addComment AFTER the reply row is inserted;
// fire-and-forget (runAfter(0)) so a notification failure never fails the
// comment write (pattern: announcements/discord scheduling).
//
// P0 (#21): NEVER fires for a self-reply (recipient must differ from the
// actor — asserted in convex/features/notifications/producer.test.ts). No PII
// beyond the replier's displayName; copy is Bahasa Indonesia.
import type { Doc, Id } from "../../_generated/dataModel";
import type { MutationCtx } from "../../_generated/server";
import { createNotificationRef } from "../notifications/refs";
import { postHref, replierName, schedulePostReplyNotification, snippet } from "../posts/notify";

/** Max materi-title chars quoted in the notification body (bounded copy). */
const TITLE_SNIPPET = 60;

/**
 * The CANONICAL materi permalink — the same URL search hits and shares use
 * (DECISIONS #36/#37). A materi can be taught in several courses or none, so
 * the notification no longer points at one course's reader path. A row that
 * has not been slugged yet falls back to the library index rather than
 * producing a dead link.
 */
function materiHref(tenantSlug: string, lesson: Doc<"lessons">): string {
  const base = `/k/${tenantSlug}/materi`;
  return lesson.slug === undefined ? base : `${base}/${lesson.slug}`;
}

/**
 * Schedule a comment_reply notification for the PARENT comment's author.
 * No-ops silently when: the reply is a self-reply (P0), or the parent /
 * tenant row is gone (dangling data must not crash the comment write).
 * The deep-link href derives from the materi row addComment already loaded.
 */
export async function maybeScheduleReplyNotification(
  ctx: MutationCtx,
  args: {
    parentId: Id<"comments">;
    lesson: Doc<"lessons">;
    /** The comment author (actor) — from ctx auth, never from client args. */
    replierId: Id<"users">;
  }
): Promise<void> {
  // Parent was validated by assertRootParentOnLesson in the same txn; re-read
  // is a cheap by-ID get and keeps this hook self-contained.
  const parent = await ctx.db.get(args.parentId);
  if (parent === null) return;
  if (parent.userId === args.replierId) return; // self-reply → no notification (P0)

  const [tenant, profile] = await Promise.all([
    ctx.db.get(args.lesson.tenantId),
    ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", args.replierId))
      .unique(),
  ]);
  if (tenant === null) return; // dangling — skip silently

  const who = profile?.displayName ?? "Seseorang";
  const lessonTitle =
    args.lesson.title.length > TITLE_SNIPPET
      ? `${args.lesson.title.slice(0, TITLE_SNIPPET)}…`
      : args.lesson.title;

  await ctx.scheduler.runAfter(0, createNotificationRef, {
    userId: parent.userId, // recipient = parent author (≠ actor, guarded above)
    tenantId: args.lesson.tenantId,
    kind: "comment_reply",
    title: "Balasan baru di diskusimu",
    body: `${who} membalas komentarmu di materi "${lessonTitle}".`,
    href: materiHref(tenant.slug, args.lesson),
  });
}

/**
 * Producer hook #2 (v1.8 #29) — notifications for a comment on a POST.
 * At most two rows, both fire-and-forget and both self-guarded:
 *   1. the POST author, kind "post_reply" (every comment, root or reply);
 *   2. the PARENT comment author, kind "comment_reply" — only for a reply, and
 *      skipped when that author is the post author (already covered by #1) or
 *      the replier themselves. So nobody is ever notified twice about one
 *      comment, and nobody is ever notified about their own.
 */
export async function maybeSchedulePostCommentNotifications(
  ctx: MutationCtx,
  args: {
    post: Doc<"posts">;
    parentId: Id<"comments"> | undefined;
    /** The comment author (actor) — from ctx auth, never from client args. */
    replierId: Id<"users">;
  }
): Promise<void> {
  await schedulePostReplyNotification(ctx, { post: args.post, replierId: args.replierId });
  if (args.parentId === undefined) return;

  const parent = await ctx.db.get(args.parentId);
  if (parent === null) return; // dangling — skip silently
  if (parent.userId === args.replierId) return; // self-reply → no notification (P0)
  if (parent.userId === args.post.authorId) return; // already notified as the post author

  const tenant = await ctx.db.get(args.post.tenantId);
  if (tenant === null) return;
  await ctx.scheduler.runAfter(0, createNotificationRef, {
    userId: parent.userId,
    tenantId: args.post.tenantId,
    kind: "comment_reply",
    title: "Balasan baru di komentarmu",
    body: `${await replierName(ctx, args.replierId)} membalas komentarmu di "${snippet(
      args.post.title
    )}".`,
    href: postHref(tenant.slug, args.post._id),
  });
}
