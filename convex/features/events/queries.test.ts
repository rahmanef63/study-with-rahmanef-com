/// <reference types="vite/client" />
// Read specs for the events etalase (#31). The anonymous projection is
// asserted KEY BY KEY (P0 §6: explicit safe projection — no createdBy, no
// tenantId, no canceledAt, no id beyond the event's own).
import { describe, expect, test } from "vitest";
import { api } from "../../_generated/api";
import { DAY_MS, HOUR_MS, asUser, seedEvent, seedTenantFixture, setup } from "./test.helpers";

const PUBLIC_EVENT_KEYS = [
  "_id",
  "description",
  "endsAt",
  "hasLocation",
  "locationUrl",
  "startsAt",
  "title",
];

describe("publicListUpcoming", () => {
  test("anonymous read; projection has EXACTLY the safe keys", async () => {
    const t = setup();
    const fx = await seedTenantFixture(t);
    const startsAt = Date.now() + DAY_MS;
    await seedEvent(t, fx, {
      title: "Sesi live",
      description: "Bahas prompt",
      startsAt,
      endsAt: startsAt + HOUR_MS,
      locationUrl: "https://discord.gg/belajar",
    });

    const rows = await t.query(api.features.events.queries.publicListUpcoming, {
      tenantId: fx.tenantId,
    });
    expect(rows).toHaveLength(1);
    expect(Object.keys(rows[0]).sort()).toEqual(PUBLIC_EVENT_KEYS);
    expect(rows[0].title).toBe("Sesi live");
    expect(rows[0].description).toBe("Bahas prompt");
    expect(rows[0].startsAt).toBe(startsAt);
    expect(rows[0].endsAt).toBe(startsAt + HOUR_MS);
    // Anonymous callers learn that a link EXISTS, never what it is — the join
    // link is the members-only half of a live session.
    expect(rows[0].hasLocation).toBe(true);
    expect(rows[0].locationUrl).toBeNull();
    // Explicitly absent (P0): the row's author and tenant never travel.
    expect(rows[0]).not.toHaveProperty("createdBy");
    expect(rows[0]).not.toHaveProperty("tenantId");
    expect(rows[0]).not.toHaveProperty("canceledAt");
    expect(rows[0]).not.toHaveProperty("_creationTime");
  });

  test("unset optionals project as null, so the key set stays stable", async () => {
    const t = setup();
    const fx = await seedTenantFixture(t);
    await seedEvent(t, fx, { title: "Tanpa detail" });
    const [row] = await t.query(api.features.events.queries.publicListUpcoming, {
      tenantId: fx.tenantId,
    });
    expect(Object.keys(row).sort()).toEqual(PUBLIC_EVENT_KEYS);
    expect(row.description).toBeNull();
    expect(row.endsAt).toBeNull();
    expect(row.locationUrl).toBeNull();
  });

  test("soonest first; past and CANCELED rows excluded", async () => {
    const t = setup();
    const fx = await seedTenantFixture(t);
    const now = Date.now();
    await seedEvent(t, fx, { title: "Minggu depan", startsAt: now + 7 * DAY_MS });
    await seedEvent(t, fx, { title: "Besok", startsAt: now + DAY_MS });
    await seedEvent(t, fx, { title: "Kemarin", startsAt: now - DAY_MS });
    await seedEvent(t, fx, { title: "Dibatalkan", startsAt: now + 2 * DAY_MS, canceledAt: now });

    const rows = await t.query(api.features.events.queries.publicListUpcoming, {
      tenantId: fx.tenantId,
    });
    expect(rows.map((r) => r.title)).toEqual(["Besok", "Minggu depan"]);
  });

  test("member of another tenant sees only their own tenant's calendar", async () => {
    const t = setup();
    const fx = await seedTenantFixture(t);
    const other = await seedTenantFixture(t, "komunitas-lain");
    await seedEvent(t, fx, { title: "Punya A" });
    await seedEvent(t, other, { title: "Punya B" });
    const rows = await t
      .withIdentity(asUser(other.memberId))
      .query(api.features.events.queries.publicListUpcoming, { tenantId: other.tenantId });
    expect(rows.map((r) => r.title)).toEqual(["Punya B"]);
  });

  test("suspended / pending tenant → NOT_FOUND (no calendar for a dark community)", async () => {
    const t = setup();
    for (const [i, status] of (["suspended", "pending"] as const).entries()) {
      const fx = await seedTenantFixture(t, `komunitas-${i}`, status);
      await seedEvent(t, fx);
      await expect(
        t.query(api.features.events.queries.publicListUpcoming, { tenantId: fx.tenantId })
      ).rejects.toThrow(/NOT_FOUND/);
    }
  });
});

describe("publicListPast", () => {
  test("most recent first; future and canceled rows excluded", async () => {
    const t = setup();
    const fx = await seedTenantFixture(t);
    const now = Date.now();
    await seedEvent(t, fx, { title: "Lama", startsAt: now - 30 * DAY_MS });
    await seedEvent(t, fx, { title: "Baru saja", startsAt: now - HOUR_MS });
    await seedEvent(t, fx, { title: "Nanti", startsAt: now + DAY_MS });
    await seedEvent(t, fx, { title: "Batal", startsAt: now - 2 * DAY_MS, canceledAt: now });

    const rows = await t.query(api.features.events.queries.publicListPast, { tenantId: fx.tenantId });
    expect(rows.map((r) => r.title)).toEqual(["Baru saja", "Lama"]);
    expect(Object.keys(rows[0]).sort()).toEqual(PUBLIC_EVENT_KEYS);
  });

  test("suspended tenant → NOT_FOUND", async () => {
    const t = setup();
    const fx = await seedTenantFixture(t, "komunitas-mati", "suspended");
    await seedEvent(t, fx, { startsAt: Date.now() - DAY_MS });
    await expect(
      t.query(api.features.events.queries.publicListPast, { tenantId: fx.tenantId })
    ).rejects.toThrow(/NOT_FOUND/);
  });
});

describe("join link — member-only", () => {
  test("a member sees locationUrl; an outsider sees only hasLocation", async () => {
    const t = setup();
    const fx = await seedTenantFixture(t);
    await seedEvent(t, fx, {
      title: "Sesi live",
      startsAt: Date.now() + 86_400_000,
      locationUrl: "https://discord.gg/belajar",
    });

    const [asMember] = await t
      .withIdentity(asUser(fx.memberId))
      .query(api.features.events.queries.publicListUpcoming, { tenantId: fx.tenantId });
    expect(asMember.hasLocation).toBe(true);
    expect(asMember.locationUrl).toBe("https://discord.gg/belajar");

    const [asOutsider] = await t
      .withIdentity(asUser(fx.outsiderId))
      .query(api.features.events.queries.publicListUpcoming, { tenantId: fx.tenantId });
    expect(asOutsider.hasLocation).toBe(true);
    expect(asOutsider.locationUrl).toBeNull();
    expect(JSON.stringify(asOutsider)).not.toContain("discord.gg");
  });
});
