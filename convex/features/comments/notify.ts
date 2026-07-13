// comments feature — producer hook #1 for notifications (#21, wave v1.3):
// comment_reply. Called from addComment AFTER the reply row is inserted;
// fire-and-forget (runAfter(0)) so a notification failure never fails the
// comment write (pattern: announcements/discord scheduling).
//
// P0 (#21): NEVER fires for a self-reply (recipient must differ from the
// actor — asserted in convex/features/notifications/producer.test.ts). No PII
// beyond the replier's displayName; copy is Bahasa Indonesia.
import { makeFunctionReference } from "convex/server";
import type { Doc, Id } from "../../_generated/dataModel";
import type { MutationCtx } from "../../_generated/server";

// Duplicated typed ref (contract: convex/features/notifications/refs.ts) —
// convex features have no barrel, so cross-feature code shares the PATH STRING
// only (precedent: per-feature test.helpers duplication).
const createNotificationRef = makeFunctionReference<
  "mutation",
  {
    userId: Id<"users">;
    tenantId: Id<"tenants">;
    kind: "comment_reply" | "resource_reviewed" | "suggestion_status";
    title: string;
    body?: string;
    href?: string;
  }
>("features/notifications/notifications:create");

/** Max lesson-title chars quoted in the notification body (bounded copy). */
const TITLE_SNIPPET = 60;

/**
 * Schedule a comment_reply notification for the PARENT comment's author.
 * No-ops silently when: the reply is a self-reply (P0), or the parent /
 * course / tenant row is gone (dangling data must not crash the comment
 * write). The deep-link href derives from the lesson row addComment already
 * loaded: /kelas/<tenantSlug>/<courseSlug>/lesson/<lessonId>.
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

  const [course, tenant, profile] = await Promise.all([
    ctx.db.get(args.lesson.courseId),
    ctx.db.get(args.lesson.tenantId),
    ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", args.replierId))
      .unique(),
  ]);
  if (course === null || tenant === null) return; // dangling — skip silently

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
    body: `${who} membalas komentarmu di lesson "${lessonTitle}".`,
    href: `/kelas/${tenant.slug}/${course.slug}/lesson/${args.lesson._id}`,
  });
}
