/// <reference types="vite/client" />
// createRecurring specs (#31): authz-denied paths (P0), the 12-row cap, and
// the "N discrete rows, no recurrence rule" invariant.
import { describe, expect, test } from "vitest";
import { api } from "../../_generated/api";
import type { Id } from "../../_generated/dataModel";
import { DAY_MS, HOUR_MS, asUser, seedTenantFixture, setup, validEventArgs } from "./test.helpers";
import { EVENT_LIMITS, WEEK_MS } from "./validate";

async function fixture() {
  const t = setup();
  const fx = await seedTenantFixture(t);
  return { t, fx };
}

function recurringArgs(tenantId: Id<"tenants">, repeatWeekly: number, startsAt?: number) {
  return { ...validEventArgs(tenantId, { startsAt }), repeatWeekly };
}

describe("createRecurring — authz", () => {
  test("anonymous → NOT_AUTHENTICATED", async () => {
    const { t, fx } = await fixture();
    await expect(
      t.mutation(api.features.events.recurring.createRecurring, recurringArgs(fx.tenantId, 4))
    ).rejects.toThrow(/NOT_AUTHENTICATED/);
  });

  test("member → NOT_AUTHORIZED; outsider → NOT_AUTHORIZED; nothing written", async () => {
    const { t, fx } = await fixture();
    for (const userId of [fx.memberId, fx.outsiderId]) {
      await expect(
        t
          .withIdentity(asUser(userId))
          .mutation(api.features.events.recurring.createRecurring, recurringArgs(fx.tenantId, 4))
      ).rejects.toThrow(/NOT_AUTHORIZED/);
    }
    const rows = await t.run((ctx) =>
      ctx.db
        .query("events")
        .withIndex("by_tenant_start", (q) => q.eq("tenantId", fx.tenantId))
        .take(50)
    );
    expect(rows).toHaveLength(0);
  });
});

describe("createRecurring — the cap", () => {
  test(`repeatWeekly = ${EVENT_LIMITS.maxRepeatWeekly} passes; +1 → VALIDATION_FAILED, zero rows`, async () => {
    const { t, fx } = await fixture();
    const as = t.withIdentity(asUser(fx.instructorId));
    await expect(
      as.mutation(
        api.features.events.recurring.createRecurring,
        recurringArgs(fx.tenantId, EVENT_LIMITS.maxRepeatWeekly + 1)
      )
    ).rejects.toThrow(/VALIDATION_FAILED/);
    const none = await t.run((ctx) =>
      ctx.db
        .query("events")
        .withIndex("by_tenant_start", (q) => q.eq("tenantId", fx.tenantId))
        .take(50)
    );
    expect(none).toHaveLength(0); // cap checked BEFORE any insert

    const { eventIds } = await as.mutation(
      api.features.events.recurring.createRecurring,
      recurringArgs(fx.tenantId, EVENT_LIMITS.maxRepeatWeekly)
    );
    expect(eventIds).toHaveLength(EVENT_LIMITS.maxRepeatWeekly);
  });

  test("repeatWeekly 0, -1 and 1.5 → VALIDATION_FAILED", async () => {
    const { t, fx } = await fixture();
    const as = t.withIdentity(asUser(fx.instructorId));
    for (const repeatWeekly of [0, -1, 1.5]) {
      await expect(
        as.mutation(api.features.events.recurring.createRecurring, recurringArgs(fx.tenantId, repeatWeekly))
      ).rejects.toThrow(/VALIDATION_FAILED/);
    }
  });

  test("repeatWeekly = 1 writes exactly one row", async () => {
    const { t, fx } = await fixture();
    const { eventIds } = await t
      .withIdentity(asUser(fx.instructorId))
      .mutation(api.features.events.recurring.createRecurring, recurringArgs(fx.tenantId, 1));
    expect(eventIds).toHaveLength(1);
  });
});

describe("createRecurring — discrete rows, no recurrence rule", () => {
  test("N rows exactly one week apart; duration preserved; no rule field stored", async () => {
    const { t, fx } = await fixture();
    const startsAt = Date.now() + DAY_MS;
    const { eventIds } = await t.withIdentity(asUser(fx.instructorId)).mutation(
      api.features.events.recurring.createRecurring,
      { ...validEventArgs(fx.tenantId, { startsAt, endsAt: startsAt + HOUR_MS }), repeatWeekly: 3 }
    );
    expect(eventIds).toHaveLength(3);

    const rows = await t.run(async (ctx) =>
      Promise.all((eventIds as Id<"events">[]).map((id) => ctx.db.get(id)))
    );
    rows.forEach((row, week) => {
      expect(row?.startsAt).toBe(startsAt + week * WEEK_MS);
      expect(row?.endsAt).toBe(startsAt + week * WEEK_MS + HOUR_MS); // duration intact
      expect(row?.createdBy).toBe(fx.instructorId);
      expect(row?.tenantId).toBe(fx.tenantId);
      // Each occurrence is an independent row — no series id, no RRULE (#31).
      expect(Object.keys(row ?? {}).sort()).toEqual(
        ["_creationTime", "_id", "createdBy", "endsAt", "startsAt", "tenantId", "title"].sort()
      );
    });
  });

  test("past first occurrence → VALIDATION_FAILED before any insert", async () => {
    const { t, fx } = await fixture();
    await expect(
      t
        .withIdentity(asUser(fx.instructorId))
        .mutation(
          api.features.events.recurring.createRecurring,
          recurringArgs(fx.tenantId, 3, Date.now() - HOUR_MS)
        )
    ).rejects.toThrow(/VALIDATION_FAILED/);
    const rows = await t.run((ctx) =>
      ctx.db
        .query("events")
        .withIndex("by_tenant_start", (q) => q.eq("tenantId", fx.tenantId))
        .take(50)
    );
    expect(rows).toHaveLength(0);
  });
});
