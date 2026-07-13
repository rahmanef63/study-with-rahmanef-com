// notifications feature — read surface (#21). NOT an etalase surface: every
// query is requireUser-FIRST and scoped to the caller's own rows via the
// by_user_read index (own-rows-only asserted in queries.test.ts). Every read
// is indexed + bounded (.take), never a bare .collect(). Raw docs never leave
// — safe projection via toNotificationItem (projections.ts).
import { query } from "../../_generated/server";
import { requireUser } from "../../_shared/auth";
import { toNotificationItem, type NotificationItem } from "./projections";
import { READ_TAKE, UNREAD_COUNT_CAP, UNREAD_TAKE } from "./validate";

/**
 * The caller's inbox, unread-first: newest UNREAD_TAKE unread rows, then the
 * READ_TAKE most recently READ rows for context. Two bounded index scans on
 * by_user_read — `eq(readAt, undefined)` matches unread; `gt(readAt, 0)`
 * matches read rows only (undefined sorts below every number, so unread rows
 * can never leak into the read scan).
 */
export const listMine = query({
  args: {},
  handler: async (ctx): Promise<NotificationItem[]> => {
    const userId = await requireUser(ctx);
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_user_read", (q) => q.eq("userId", userId).eq("readAt", undefined))
      .order("desc") // index tie-breaks on _creationTime → newest first
      .take(UNREAD_TAKE);
    const read = await ctx.db
      .query("notifications")
      .withIndex("by_user_read", (q) => q.eq("userId", userId).gt("readAt", 0))
      .order("desc") // largest readAt first → most recently read
      .take(READ_TAKE);
    return [...unread, ...read].map(toNotificationItem);
  },
});

/**
 * Unread badge count, capped at UNREAD_COUNT_CAP (the bell renders "99+" at
 * the cap — no unbounded count scan on a hot query).
 */
export const unreadCount = query({
  args: {},
  handler: async (ctx): Promise<number> => {
    const userId = await requireUser(ctx);
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_user_read", (q) => q.eq("userId", userId).eq("readAt", undefined))
      .take(UNREAD_COUNT_CAP);
    return unread.length;
  },
});
