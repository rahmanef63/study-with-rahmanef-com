// resources feature — notification producer plumbing (#22, wave v1.3).
//
// Producers (resources:curate, suggestions:setStatus) schedule an INTERNAL
// mutation that inserts into the shared `notifications` table (schema by alpha,
// DATA-MODEL fase-2 2026-07-11) — pattern: features/announcements (scheduler →
// internal mutation). No new tables (P0 #22).
//
// The #21 swap is DONE: this feature schedules the canonical
// features/notifications/notifications:create, which runs assertCreateInput
// (title/body caps, href must start with "/"). The local shadow `create` that
// used to insert into `notifications` with zero validation is gone — every
// curation notification now goes through the one contract.
import type { Id } from "../../_generated/dataModel";
import { type MutationCtx } from "../../_generated/server";
import { createNotificationRef } from "../notifications/refs";

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

/** Scheduled producer target — the canonical, validating notifications:create. */
export const notifyCreateRef = createNotificationRef;

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
