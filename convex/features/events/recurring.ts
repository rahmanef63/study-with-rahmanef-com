// events feature — "ulangi mingguan × N" (DECISIONS #31).
//
// THE WHOLE POINT: this inserts N DISCRETE ROWS in ONE mutation. There is no
// recurrence rule in the schema and there must never be one. RRULE parsing,
// exception dates ("skip the week of Idul Fitri"), infinite series and
// timezone-aware expansion are the classic over-engineering trap here; N rows
// are editable and cancellable one by one with the mutations that already
// exist, which is exactly what a small community needs.
//
// P0: v.* validators on every arg; requireTenantRole is the FIRST handler line.
import { v } from "convex/values";
import { mutation } from "../../_generated/server";
import type { Id } from "../../_generated/dataModel";
import { requireTenantRole } from "../../_shared/auth";
import { assertRepeatWeekly, validateNewEvent, WEEK_MS } from "./validate";

/**
 * Schedule the same session `repeatWeekly` times, one week apart.
 * `repeatWeekly` counts TOTAL occurrences (1 = a single session, identical to
 * `create`) and is capped at EVENT_LIMITS.maxRepeatWeekly = 12 — a whole
 * quarter, and a hard bound on how many rows one call can write.
 *
 * Only the FIRST occurrence must be in the future; the later ones are derived
 * from it, so they always are too. endsAt shifts by the same offset, which
 * keeps each session's duration intact.
 */
export const createRecurring = mutation({
  args: {
    tenantId: v.id("tenants"),
    title: v.string(),
    description: v.optional(v.string()),
    startsAt: v.number(),
    endsAt: v.optional(v.number()),
    locationUrl: v.optional(v.string()),
    repeatWeekly: v.number(),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireTenantRole(ctx, args.tenantId, "instructor");
    assertRepeatWeekly(args.repeatWeekly); // cap BEFORE any write (bounded insert)
    const fields = validateNewEvent(args, Date.now());

    const eventIds: Id<"events">[] = [];
    for (let week = 0; week < args.repeatWeekly; week++) {
      const offset = week * WEEK_MS;
      eventIds.push(
        await ctx.db.insert("events", {
          tenantId: args.tenantId,
          title: fields.title,
          description: fields.description,
          startsAt: fields.startsAt + offset,
          endsAt: fields.endsAt === undefined ? undefined : fields.endsAt + offset,
          locationUrl: fields.locationUrl,
          createdBy: userId,
        })
      );
    }
    return { eventIds };
  },
});
