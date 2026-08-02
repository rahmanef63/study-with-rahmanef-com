// announcements feature — notification fan-out producer (#28, wave v1.4).
// Called from mutations:create AFTER the announcement row is inserted;
// fire-and-forget so a notification failure never fails the announcement write
// (pattern: comments/notify.ts + this feature's own Discord scheduling — which
// stays untouched and runs in parallel with this hook).
//
// P0 (#28): the sender NEVER notifies themself (asserted in notify.test.ts).
// Bounded by design: memberships read is take(MEMBER_FANOUT_TAKE) and the
// whole fan-out is ONE scheduled internal mutation (never one job per member).
import { makeFunctionReference } from "convex/server";
import type { Id } from "../../_generated/dataModel";
import type { MutationCtx } from "../../_generated/server";

// Duplicated typed ref (contract: convex/features/notifications/refs.ts —
// createManyNotificationsRef). Convex features have no barrel, so cross-feature
// code shares the PATH STRING only (precedent: comments/notify.ts).
const createManyNotificationsRef = makeFunctionReference<
  "mutation",
  {
    tenantId: Id<"tenants">;
    kind: "comment_reply" | "resource_reviewed" | "suggestion_status" | "announcement";
    title: string;
    body?: string;
    href?: string;
    recipientIds: Id<"users">[];
  },
  number
>("features/notifications/notifications:createMany");

/**
 * Memberships read bound = the notifications-side CREATE_MANY_CAP (200).
 * Recipients are always < this after the sender is dropped, so the scheduled
 * createMany can never trip its own cap from this producer.
 */
export const MEMBER_FANOUT_TAKE = 200;

/** Notifications-side MAX_TITLE (validate.ts) — defensive truncation bound. */
const NOTIFICATION_TITLE_MAX = 120;

/**
 * Schedule the "announcement" inbox fan-out for every tenant member EXCEPT the
 * sender. ONE ctx.scheduler.runAfter(0, createMany, …) for the whole list.
 * No-ops silently when the tenant row is gone or there is no other member —
 * dangling data must not crash the announcement write. Deep-link:
 * /pengumuman/<tenantSlug> (OS-shell relative path).
 */
export async function scheduleAnnouncementFanout(
  ctx: MutationCtx,
  args: {
    tenantId: Id<"tenants">;
    /** The announcement author (actor) — from ctx auth, never client args. */
    senderId: Id<"users">;
    /** Already validated/trimmed by validateCreateInput (≤120 chars). */
    title: string;
  }
): Promise<void> {
  const tenant = await ctx.db.get(args.tenantId);
  if (tenant === null) return; // dangling — skip silently

  const memberships = await ctx.db
    .query("memberships")
    .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
    .take(MEMBER_FANOUT_TAKE);

  const recipientIds = memberships
    .map((m) => m.userId)
    .filter((userId) => userId !== args.senderId); // no self-notify (P0)
  if (recipientIds.length === 0) return;

  // Announcement titleMax (120) equals the notifications MAX_TITLE, so this
  // truncation is defensive only — it keeps the two bounds decoupled.
  const title =
    args.title.length > NOTIFICATION_TITLE_MAX
      ? `${args.title.slice(0, NOTIFICATION_TITLE_MAX - 1)}…`
      : args.title;

  await ctx.scheduler.runAfter(0, createManyNotificationsRef, {
    tenantId: args.tenantId,
    kind: "announcement",
    title,
    href: `/pengumuman/${tenant.slug}`,
    recipientIds,
  });
}
