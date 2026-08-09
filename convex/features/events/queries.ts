// events feature — read surface (Kalender, #31).
//
// ANONYMOUS ETALASE WHITELIST (AGENTS.md §6): publicListUpcoming,
// publicListPast. These two are the ONLY functions in this slice without an
// authz helper, and they qualify because ALL of the following hold:
//   1. both names start with `public` AND are listed here (auditable);
//   2. they read through the by_tenant_start index only, behind
//      requireActiveTenantById — the tenantId arrives from the client, so a
//      suspended/pending community must not keep serving its calendar to
//      anyone who kept the id — and canceled rows are dropped; every read is a
//      bounded .take(), never a bare .collect();
//   3. they return the explicit PublicEvent projection — never a raw doc,
//      never createdBy, never an id beyond the event's own, and never
//      `locationUrl` for a non-member (see below).
// Mutations NEVER qualify (§6): every write in this slice is instructor+.
//
// Anonymous read is deliberate: SSR is anonymous-only (DECISIONS #35), so a
// shareable /k/<slug> page can only render the calendar through a whitelisted
// query. It widens the DATA-MODEL access table's "member tenant" for events —
// recorded there in the same commit, per AGENTS.md §1.
//
// The widening is SCOPED, not blanket: what is public is "this community meets,
// here is when", which is exactly the discovery signal a calendar is for. The
// JOIN LINK stays member-only — one query, member-aware, so a logged-in member
// still pays a single round trip and anon simply gets a narrower projection.
import { v } from "convex/values";
import type { Doc, Id } from "../../_generated/dataModel";
import { query } from "../../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { requireActiveTenantById } from "../../_shared/auth";
import type { QueryCtx } from "../../_generated/server";
import { toPublicEvent, type PublicEvent } from "./projections";
import { EVENT_LIMITS } from "./validate";

/** Membership WITHOUT throwing — this is a public surface that shows MORE to a
 *  member, not a gate. Never use it where an authz helper belongs. */
async function isTenantMember(ctx: QueryCtx, tenantId: Id<"tenants">): Promise<boolean> {
  const userId = await getAuthUserId(ctx);
  if (userId === null) return false;
  const membership = await ctx.db
    .query("memberships")
    .withIndex("by_tenant_user", (q) => q.eq("tenantId", tenantId).eq("userId", userId))
    .unique();
  return membership !== null;
}

/**
 * canceledAt is not part of by_tenant_start, so cancellations are filtered
 * AFTER the index take — hence scanTake > listTake (validate.ts).
 * TODO(rr): confirm — canceled sessions are hidden outright rather than
 * returned with a flag; the schema comment imagines them "struck through", so
 * add `canceled: boolean` to PublicEvent if the UI ever wants that.
 */
function live(event: Doc<"events">): boolean {
  return event.canceledAt === undefined;
}

/**
 * Upcoming sessions, soonest first — ANONYMOUS (etalase, §6).
 * `startsAt >= now` is an index RANGE, so past rows are never read.
 */
export const publicListUpcoming = query({
  args: { tenantId: v.id("tenants") },
  handler: async (ctx, args): Promise<PublicEvent[]> => {
    await requireActiveTenantById(ctx, args.tenantId);
    const isMember = await isTenantMember(ctx, args.tenantId);
    const now = Date.now();
    const rows = await ctx.db
      .query("events")
      .withIndex("by_tenant_start", (q) => q.eq("tenantId", args.tenantId).gte("startsAt", now))
      .take(EVENT_LIMITS.scanTake); // ascending: the next session first
    return rows
      .filter(live)
      .slice(0, EVENT_LIMITS.listTake)
      .map((e) => toPublicEvent(e, isMember));
  },
});

/**
 * Past sessions, most recent first — ANONYMOUS (etalase, §6). Same index,
 * mirrored range + descending order, so the archive never walks the future.
 */
export const publicListPast = query({
  args: { tenantId: v.id("tenants") },
  handler: async (ctx, args): Promise<PublicEvent[]> => {
    await requireActiveTenantById(ctx, args.tenantId);
    const isMember = await isTenantMember(ctx, args.tenantId);
    const now = Date.now();
    const rows = await ctx.db
      .query("events")
      .withIndex("by_tenant_start", (q) => q.eq("tenantId", args.tenantId).lt("startsAt", now))
      .order("desc")
      .take(EVENT_LIMITS.scanTake);
    return rows
      .filter(live)
      .slice(0, EVENT_LIMITS.listTake)
      .map((e) => toPublicEvent(e, isMember));
  },
});
