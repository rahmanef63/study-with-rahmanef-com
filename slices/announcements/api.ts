// announcements slice — Convex function references (one place to update if the
// convex/features/announcements layout ever moves). Consumers use these for
// preloadQuery/useQuery instead of hand-writing paths.
//
// Built with makeFunctionReference (not `api.features.announcements.*`) because
// the checked-in convex/_generated/api.d.ts is the strict typed variant and does
// not yet include this brand-new feature (regen is integrator-only, AGENTS.md
// §4). The path strings match convex/features/announcements/refs.ts and resolve
// identically at runtime. TODO(rr): swap to `api.features.announcements.*` after
// alpha regenerates _generated.
import { makeFunctionReference } from "convex/server";
import type { Id } from "@convex/_generated/dataModel";

export const announcementsApi = {
  /** query — member: tenant announcements, newest first (safe projection). */
  list: makeFunctionReference<"query", { tenantId: Id<"tenants"> }>(
    "features/announcements/queries:list"
  ),
  /** mutation — instructor+: create + schedule the Discord post. */
  create: makeFunctionReference<
    "mutation",
    { tenantId: Id<"tenants">; title: string; bodyMd: string }
  >("features/announcements/mutations:create"),
};
