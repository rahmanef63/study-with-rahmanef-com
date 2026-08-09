// events feature — write surface (Kalender, #31). Access table
// (docs/DATA-MODEL.md): events write = instructor+.
//
// P0 per handler: v.* validators on every arg; the authz helper is the FIRST
// line. `create` takes a tenantId from args, so requireTenantRole gates it
// directly (it calls requireUser internally). `update`/`cancel` take an
// eventId, so they go through requireInstructorForEvent, which authenticates
// BEFORE the by-id read.
//
// `createRecurring` lives in ./recurring.ts (file-size ceiling).
import { v } from "convex/values";
import { mutation } from "../../_generated/server";
import { requireTenantRole } from "../../_shared/auth";
import { requireInstructorForEvent } from "./access";
import { buildEventPatch, validateNewEvent } from "./validate";

/**
 * Schedule one session. startsAt must be in the future; endsAt (optional) must
 * be after it; locationUrl (optional) must be https.
 */
export const create = mutation({
  args: {
    tenantId: v.id("tenants"),
    title: v.string(),
    description: v.optional(v.string()),
    startsAt: v.number(),
    endsAt: v.optional(v.number()),
    locationUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireTenantRole(ctx, args.tenantId, "instructor");
    const fields = validateNewEvent(args, Date.now());
    return await ctx.db.insert("events", {
      tenantId: args.tenantId, // gated above; never trusted for a role check elsewhere
      ...fields,
      createdBy: userId,
    });
  },
});

// ponytail: reminders ("acara mulai 30 menit lagi") are OUT OF SCOPE for this
// pass — no new table, no cron, nothing to maintain until someone asks. The
// upgrade path is already paved and costs one call from right here:
//   ctx.scheduler.runAt(startsAt - 30 * 60_000, internal.<notifications
//   fanout>, { tenantId, kind: "event_soon", … })
// writing into the EXISTING `notifications` table, whose `kind` union already
// carries the "event_soon" literal (convex/_tables/boards.ts). Rescheduling on
// `update` and cancelling the job on `cancel` are the only extra work; do that
// only when the calendar has real traffic.

/**
 * Edit a session. Omitted fields stay unchanged; "" clears description /
 * locationUrl. Rules live in buildEventPatch (validate.ts) — notably endsAt is
 * re-checked against the effective startsAt, so moving the start past a stored
 * end is rejected instead of silently storing an impossible range.
 */
export const update = mutation({
  args: {
    eventId: v.id("events"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    startsAt: v.optional(v.number()),
    endsAt: v.optional(v.number()),
    locationUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { event } = await requireInstructorForEvent(ctx, args.eventId);
    await ctx.db.patch(event._id, buildEventPatch(event, args));
    return event._id;
  },
});

/**
 * Soft cancel — NEVER a hard delete: members may already have the session in
 * their own calendar, and the row is the only record that it was ever planned.
 * Idempotent: cancelling an already-canceled event keeps the FIRST timestamp.
 * Canceled rows drop out of both public lists (queries.ts).
 */
export const cancel = mutation({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const { event } = await requireInstructorForEvent(ctx, args.eventId);
    if (event.canceledAt === undefined) {
      await ctx.db.patch(event._id, { canceledAt: Date.now() });
    }
    return event._id;
  },
});
