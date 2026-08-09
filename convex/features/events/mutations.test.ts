/// <reference types="vite/client" />
// Mutation specs for the events feature (#31). DoD §5.2 (P0): EVERY mutation
// exercises the authz-DENIED paths (unauthenticated + wrong role), plus the
// assignment's named cases: future-start rule, endsAt ordering, https-only
// link, soft cancel, and auth-BEFORE-read (dangling id).
import { describe, expect, test } from "vitest";
import { api } from "../../_generated/api";
import type { Id } from "../../_generated/dataModel";
import { DAY_MS, HOUR_MS, asUser, seedEvent, seedTenantFixture, setup, validEventArgs } from "./test.helpers";

async function fixture() {
  const t = setup();
  const fx = await seedTenantFixture(t);
  return { t, fx };
}

describe("create — authz", () => {
  test("anonymous → NOT_AUTHENTICATED", async () => {
    const { t, fx } = await fixture();
    await expect(
      t.mutation(api.features.events.mutations.create, validEventArgs(fx.tenantId))
    ).rejects.toThrow(/NOT_AUTHENTICATED/);
  });

  test("member (wrong role) → NOT_AUTHORIZED", async () => {
    const { t, fx } = await fixture();
    await expect(
      t
        .withIdentity(asUser(fx.memberId))
        .mutation(api.features.events.mutations.create, validEventArgs(fx.tenantId))
    ).rejects.toThrow(/NOT_AUTHORIZED/);
  });

  test("outsider (no membership) → NOT_AUTHORIZED", async () => {
    const { t, fx } = await fixture();
    await expect(
      t
        .withIdentity(asUser(fx.outsiderId))
        .mutation(api.features.events.mutations.create, validEventArgs(fx.tenantId))
    ).rejects.toThrow(/NOT_AUTHORIZED/);
  });

  test("instructor of ANOTHER tenant → NOT_AUTHORIZED", async () => {
    const { t, fx } = await fixture();
    const other = await seedTenantFixture(t, "komunitas-lain");
    await expect(
      t
        .withIdentity(asUser(other.instructorId))
        .mutation(api.features.events.mutations.create, validEventArgs(fx.tenantId))
    ).rejects.toThrow(/NOT_AUTHORIZED/);
  });
});

describe("create — writes & validation", () => {
  test("instructor creates; createdBy + tenantId stored, canceledAt unset", async () => {
    const { t, fx } = await fixture();
    const startsAt = Date.now() + DAY_MS;
    const id: Id<"events"> = await t.withIdentity(asUser(fx.instructorId)).mutation(
      api.features.events.mutations.create,
      validEventArgs(fx.tenantId, {
        title: "  Sesi live: prompt dasar  ",
        description: "  Bahas prompt  ",
        startsAt,
        endsAt: startsAt + HOUR_MS,
        locationUrl: "https://discord.gg/belajar",
      })
    );
    const row = await t.run((ctx) => ctx.db.get(id));
    expect(row?.tenantId).toBe(fx.tenantId);
    expect(row?.createdBy).toBe(fx.instructorId);
    expect(row?.title).toBe("Sesi live: prompt dasar"); // trimmed
    expect(row?.description).toBe("Bahas prompt");
    expect(row?.endsAt).toBe(startsAt + HOUR_MS);
    expect(row?.canceledAt).toBeUndefined();
  });

  test("owner may create too (owner outranks instructor)", async () => {
    const { t, fx } = await fixture();
    const id = await t
      .withIdentity(asUser(fx.ownerId))
      .mutation(api.features.events.mutations.create, validEventArgs(fx.tenantId));
    expect(id).toBeDefined();
  });

  test("startsAt in the past → VALIDATION_FAILED", async () => {
    const { t, fx } = await fixture();
    await expect(
      t.withIdentity(asUser(fx.instructorId)).mutation(
        api.features.events.mutations.create,
        validEventArgs(fx.tenantId, { startsAt: Date.now() - HOUR_MS })
      )
    ).rejects.toThrow(/VALIDATION_FAILED/);
  });

  test("endsAt before/equal startsAt → VALIDATION_FAILED", async () => {
    const { t, fx } = await fixture();
    const startsAt = Date.now() + DAY_MS;
    const as = t.withIdentity(asUser(fx.instructorId));
    for (const endsAt of [startsAt - 1, startsAt]) {
      await expect(
        as.mutation(
          api.features.events.mutations.create,
          validEventArgs(fx.tenantId, { startsAt, endsAt })
        )
      ).rejects.toThrow(/VALIDATION_FAILED/);
    }
  });

  test("non-https locationUrl → VALIDATION_FAILED; empty string clears it", async () => {
    const { t, fx } = await fixture();
    const as = t.withIdentity(asUser(fx.instructorId));
    for (const locationUrl of ["http://discord.gg/x", "javascript:alert(1)", "discord.gg/x"]) {
      await expect(
        as.mutation(api.features.events.mutations.create, validEventArgs(fx.tenantId, { locationUrl }))
      ).rejects.toThrow(/VALIDATION_FAILED/);
    }
    const id: Id<"events"> = await as.mutation(
      api.features.events.mutations.create,
      validEventArgs(fx.tenantId, { locationUrl: "   " })
    );
    expect((await t.run((ctx) => ctx.db.get(id)))?.locationUrl).toBeUndefined();
  });

  test("title shorter than 3 / longer than 120 chars → VALIDATION_FAILED", async () => {
    const { t, fx } = await fixture();
    const as = t.withIdentity(asUser(fx.instructorId));
    for (const title of ["ab", "x".repeat(121)]) {
      await expect(
        as.mutation(api.features.events.mutations.create, validEventArgs(fx.tenantId, { title }))
      ).rejects.toThrow(/VALIDATION_FAILED/);
    }
  });
});

describe("update", () => {
  test("anonymous → NOT_AUTHENTICATED; member → NOT_AUTHORIZED", async () => {
    const { t, fx } = await fixture();
    const eventId = await seedEvent(t, fx);
    await expect(
      t.mutation(api.features.events.mutations.update, { eventId, title: "Ganti" })
    ).rejects.toThrow(/NOT_AUTHENTICATED/);
    await expect(
      t
        .withIdentity(asUser(fx.memberId))
        .mutation(api.features.events.mutations.update, { eventId, title: "Ganti" })
    ).rejects.toThrow(/NOT_AUTHORIZED/);
  });

  test("instructor of ANOTHER tenant → NOT_AUTHORIZED (role read from the EVENT row)", async () => {
    const { t, fx } = await fixture();
    const eventId = await seedEvent(t, fx);
    const other = await seedTenantFixture(t, "komunitas-lain");
    await expect(
      t
        .withIdentity(asUser(other.instructorId))
        .mutation(api.features.events.mutations.update, { eventId, title: "Bajak" })
    ).rejects.toThrow(/NOT_AUTHORIZED/);
  });

  test("anonymous + DANGLING eventId → NOT_AUTHENTICATED, never NOT_FOUND", async () => {
    const { t, fx } = await fixture();
    const eventId = await seedEvent(t, fx);
    await t.run((ctx) => ctx.db.delete(eventId));
    await expect(
      t.mutation(api.features.events.mutations.update, { eventId, title: "Hantu" })
    ).rejects.toThrow(/NOT_AUTHENTICATED/);
    await expect(
      t.mutation(api.features.events.mutations.cancel, { eventId })
    ).rejects.toThrow(/NOT_AUTHENTICATED/);
  });

  test("instructor + dangling eventId → NOT_FOUND", async () => {
    const { t, fx } = await fixture();
    const eventId = await seedEvent(t, fx);
    await t.run((ctx) => ctx.db.delete(eventId));
    await expect(
      t
        .withIdentity(asUser(fx.instructorId))
        .mutation(api.features.events.mutations.update, { eventId, title: "Hantu" })
    ).rejects.toThrow(/NOT_FOUND/);
  });

  test("partial patch: omitted fields unchanged, '' clears description", async () => {
    const { t, fx } = await fixture();
    const startsAt = Date.now() + DAY_MS;
    const eventId = await seedEvent(t, fx, { startsAt, description: "Lama", title: "Judul lama" });
    await t
      .withIdentity(asUser(fx.instructorId))
      .mutation(api.features.events.mutations.update, { eventId, title: "Judul baru", description: "" });
    const row = await t.run((ctx) => ctx.db.get(eventId));
    expect(row?.title).toBe("Judul baru");
    expect(row?.description).toBeUndefined();
    expect(row?.startsAt).toBe(startsAt); // untouched
  });

  test("startsAt may move into the PAST on update (create-only rule)", async () => {
    const { t, fx } = await fixture();
    const eventId = await seedEvent(t, fx);
    const past = Date.now() - DAY_MS;
    await t
      .withIdentity(asUser(fx.instructorId))
      .mutation(api.features.events.mutations.update, { eventId, startsAt: past });
    expect((await t.run((ctx) => ctx.db.get(eventId)))?.startsAt).toBe(past);
  });

  test("moving startsAt past the STORED endsAt → VALIDATION_FAILED", async () => {
    const { t, fx } = await fixture();
    const startsAt = Date.now() + DAY_MS;
    const eventId = await seedEvent(t, fx, { startsAt, endsAt: startsAt + HOUR_MS });
    await expect(
      t
        .withIdentity(asUser(fx.instructorId))
        .mutation(api.features.events.mutations.update, { eventId, startsAt: startsAt + 2 * HOUR_MS })
    ).rejects.toThrow(/VALIDATION_FAILED/);
  });
});

describe("cancel", () => {
  test("anonymous → NOT_AUTHENTICATED; member → NOT_AUTHORIZED", async () => {
    const { t, fx } = await fixture();
    const eventId = await seedEvent(t, fx);
    await expect(t.mutation(api.features.events.mutations.cancel, { eventId })).rejects.toThrow(
      /NOT_AUTHENTICATED/
    );
    await expect(
      t.withIdentity(asUser(fx.memberId)).mutation(api.features.events.mutations.cancel, { eventId })
    ).rejects.toThrow(/NOT_AUTHORIZED/);
  });

  test("soft cancel: row survives, canceledAt set, second call idempotent", async () => {
    const { t, fx } = await fixture();
    const eventId = await seedEvent(t, fx);
    const as = t.withIdentity(asUser(fx.instructorId));
    await as.mutation(api.features.events.mutations.cancel, { eventId });
    const first = await t.run((ctx) => ctx.db.get(eventId));
    expect(first).not.toBeNull(); // NEVER a hard delete
    expect(typeof first?.canceledAt).toBe("number");
    await as.mutation(api.features.events.mutations.cancel, { eventId });
    expect((await t.run((ctx) => ctx.db.get(eventId)))?.canceledAt).toBe(first?.canceledAt);
  });
});
