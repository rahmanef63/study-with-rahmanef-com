// notifications feature — write surface (#21, inbox in-app). P0 contract per
// PUBLIC handler: v.* validators + requireUser as the FIRST line, auth BEFORE
// any by-ID read (no existence oracle), recipients touch ONLY their own rows
// (asserted in notifications.test.ts).
import { v } from "convex/values";
import { internalMutation, mutation } from "../../_generated/server";
import { requireUser } from "../../_shared/auth";
import { fail } from "./errors";
import { assertCreateInput, MARK_ALL_TAKE } from "./validate";

/**
 * Generic producer target (INTERNAL — un-callable from any client). Producers
 * schedule it fire-and-forget: ctx.scheduler.runAfter(0, createNotificationRef,
 * {...}) so the source mutation stays fast and a notification failure never
 * fails the producing write. Producers guarantee recipient ≠ actor (no
 * self-notify, P0 #21) — this mutation cannot know the actor.
 * TODO(rr): confirm — no dedupe window ("dedupe optional" per the prompt);
 * repeated replies produce one row each, which the inbox groups visually.
 */
export const create = internalMutation({
  args: {
    userId: v.id("users"), // recipient
    tenantId: v.id("tenants"),
    kind: v.union(
      v.literal("comment_reply"),
      v.literal("resource_reviewed"),
      v.literal("suggestion_status")
    ),
    title: v.string(),
    body: v.optional(v.string()),
    href: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { title, body, href } = assertCreateInput(args.title, args.body, args.href);
    return ctx.db.insert("notifications", {
      userId: args.userId,
      tenantId: args.tenantId,
      kind: args.kind,
      title,
      body,
      href,
    });
  },
});

/**
 * Recipient marks ONE notification read. Own rows only: a row that does not
 * exist and a row owned by someone else both answer NOT_FOUND (no existence
 * oracle across users). Idempotent — the first readAt timestamp is kept.
 */
export const markRead = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx); // auth BEFORE read
    const row = await ctx.db.get(args.notificationId);
    if (row === null || row.userId !== userId) {
      fail("NOT_FOUND", "Notifikasi tidak ditemukan");
    }
    if (row.readAt === undefined) {
      await ctx.db.patch(row._id, { readAt: Date.now() });
    }
    return row._id;
  },
});

/**
 * Recipient marks all their unread notifications read. Own rows by
 * construction: userId comes from ctx (never args) and the by_user_read index
 * scopes the scan. Bounded write (MARK_ALL_TAKE); with more unread than the
 * cap the client simply calls again — the call is idempotent per row.
 */
export const markAllRead = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_user_read", (q) => q.eq("userId", userId).eq("readAt", undefined))
      .take(MARK_ALL_TAKE);
    const now = Date.now();
    for (const row of unread) {
      await ctx.db.patch(row._id, { readAt: now });
    }
    return unread.length;
  },
});
