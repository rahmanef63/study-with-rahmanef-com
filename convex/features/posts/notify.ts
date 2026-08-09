// posts feature — notification producer for the Diskusi feed (v1.8 #29):
// kind "post_reply". Scheduled fire-and-forget (runAfter(0)) from the comments
// mutation AFTER the reply row is inserted, so a notification failure never
// fails the comment write (pattern: comments/notify.ts, announcements/notify.ts).
//
// P0 (#21): NEVER fires for a self-reply — the recipient must differ from the
// actor. No PII beyond the replier's displayName; copy is Bahasa Indonesia.
//
// The permalink shape lives HERE because this feature owns the /post/<id>
// route; every producer links through postHref so the format has one home.
import type { Doc, Id } from "../../_generated/dataModel";
import type { MutationCtx } from "../../_generated/server";
import { createNotificationRef } from "../notifications/refs";

/** Max post-title chars quoted in a notification body (bounded copy). */
export const TITLE_SNIPPET = 60;

/** Canonical in-app permalink for a post (relative — never absolute, P0). */
export function postHref(tenantSlug: string, postId: Id<"posts">): string {
  return `/k/${tenantSlug}/post/${postId}`;
}

/** Bounded, ellipsised title for notification bodies. */
export function snippet(title: string): string {
  return title.length > TITLE_SNIPPET ? `${title.slice(0, TITLE_SNIPPET)}…` : title;
}

/** Actor's public display name, or a neutral fallback. */
export async function replierName(ctx: MutationCtx, replierId: Id<"users">): Promise<string> {
  const profile = await ctx.db
    .query("profiles")
    .withIndex("by_user", (q) => q.eq("userId", replierId))
    .unique();
  return profile?.displayName ?? "Seseorang";
}

/**
 * Notify a POST's author that someone replied to it.
 * No-ops silently when the replier IS the author (P0 self-notify guard) or the
 * tenant row is gone (dangling data must not crash the comment write).
 */
export async function schedulePostReplyNotification(
  ctx: MutationCtx,
  args: {
    post: Doc<"posts">;
    /** The comment author (actor) — from ctx auth, never from client args. */
    replierId: Id<"users">;
  }
): Promise<void> {
  if (args.post.authorId === args.replierId) return; // self-reply → no notification (P0)
  const tenant = await ctx.db.get(args.post.tenantId);
  if (tenant === null) return; // dangling — skip silently

  await ctx.scheduler.runAfter(0, createNotificationRef, {
    userId: args.post.authorId, // recipient ≠ actor (guarded above)
    tenantId: args.post.tenantId,
    kind: "post_reply",
    title: "Balasan baru di postinganmu",
    body: `${await replierName(ctx, args.replierId)} membalas "${snippet(args.post.title)}".`,
    href: postHref(tenant.slug, args.post._id),
  });
}
