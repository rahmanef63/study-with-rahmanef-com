// notifications feature — function reference for PRODUCERS (#21/#22).
//
// WHY makeFunctionReference (not `internal.features.notifications.*`): the
// checked-in convex/_generated/api.d.ts is the loose AnyApi variant today, but
// regenerating it is integrator-only (AGENTS.md §4) and a later strict regen
// must not break producers built in isolation. The path string resolves
// identically at runtime (convex-test + anyApi both honour it) and this typed
// ref keeps producer call sites arg-checked. Precedent:
// convex/features/announcements/refs.ts.
//
// Cross-feature note (epsilon #22): convex features have no barrel, so copy
// this ref into your feature (precedent: per-feature test.helpers duplication)
// — the path string below is the contract:
//   "features/notifications/notifications:create"
import { makeFunctionReference } from "convex/server";
import type { Id } from "../../_generated/dataModel";

export type CreateNotificationArgs = {
  /** Recipient — NEVER the actor (producers must not self-notify, P0 #21). */
  userId: Id<"users">;
  tenantId: Id<"tenants">;
  kind: "comment_reply" | "resource_reviewed" | "suggestion_status";
  /** Bahasa Indonesia; no PII beyond displayName. */
  title: string;
  body?: string;
  /** Relative OS-shell deep-link, must start with "/". */
  href?: string;
};

/** internalMutation — generic producer target, scheduled via runAfter(0, …). */
export const createNotificationRef = makeFunctionReference<
  "mutation",
  CreateNotificationArgs,
  Id<"notifications">
>("features/notifications/notifications:create");
