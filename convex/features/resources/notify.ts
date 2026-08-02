// resources feature — notification producer plumbing (#22, wave v1.3).
//
// Producers (resources:curate, suggestions:setStatus) schedule an INTERNAL
// mutation that inserts into the shared `notifications` table (schema by alpha,
// DATA-MODEL fase-2 2026-07-11) — pattern: features/announcements (scheduler →
// internal mutation). No new tables (P0 #22).
//
// TODO(rr): waiting on notifications barrel (#21, agent beta) — the generic
// producer target internal.features.notifications.create is being built in
// parallel and is not in the checked-in typed api. `create` below mirrors that
// contract 1:1 (userId, tenantId, kind, title, body?, href?) so at integration
// alpha may repoint `notifyCreateRef` to beta's function (one string) and drop
// the local target. makeFunctionReference keeps `npx tsc --noEmit` green while
// this slice is built in isolation (precedent: features/announcements/refs.ts).
import { makeFunctionReference } from "convex/server";
import { v } from "convex/values";
import type { Id } from "../../_generated/dataModel";
import { internalMutation, type MutationCtx } from "../../_generated/server";

/** Kinds this feature produces (subset of the schema's notification kinds). */
export type ResourcesNotifyKind = "resource_reviewed" | "suggestion_status";

export type NotifyArgs = {
  /** Recipient — always the submitter, never the acting curator. */
  userId: Id<"users">;
  tenantId: Id<"tenants">;
  kind: ResourcesNotifyKind;
  title: string;
  body?: string;
  href?: string;
};

/** Scheduled producer target — see TODO(rr) above for the #21 swap plan. */
export const notifyCreateRef = makeFunctionReference<"mutation", NotifyArgs>(
  "features/resources/notify:create"
);

/**
 * Generic notification insert. INTERNAL only — clients never create
 * notifications directly; recipients read them via the #21 inbox queries.
 * Mirrors the #21 `notifications.create` producer contract exactly.
 */
export const create = internalMutation({
  args: {
    userId: v.id("users"),
    tenantId: v.id("tenants"),
    kind: v.union(v.literal("resource_reviewed"), v.literal("suggestion_status")),
    title: v.string(),
    body: v.optional(v.string()),
    href: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("notifications", args); // readAt omitted = unread
  },
});

/**
 * Schedule a notification for `args.userId` about `actorId`'s action.
 * P0 (#22): NEVER notifies the actor about their own action — the guard lives
 * here, in one enforcement point, and is asserted in notify.test.ts.
 */
export async function scheduleNotify(
  ctx: MutationCtx,
  actorId: Id<"users">,
  args: NotifyArgs
): Promise<void> {
  if (args.userId === actorId) return; // self-action → no notification (P0)
  await ctx.scheduler.runAfter(0, notifyCreateRef, args);
}

/** Status → user-facing Bahasa Indonesia label for suggestion_status bodies. */
export const SUGGESTION_STATUS_LABEL: Record<
  "open" | "planned" | "done" | "rejected",
  string
> = {
  open: "dibuka kembali",
  planned: "direncanakan",
  done: "selesai dikerjakan",
  rejected: "ditolak",
};
