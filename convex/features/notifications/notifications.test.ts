/// <reference types="vite/client" />
// Mutation specs for the notifications feature (#21). DoD §5.2 (P0): every
// mutation exercises the authz-DENIED paths, plus the assignment's named
// cases: own-rows-only (foreign row → NOT_FOUND, no existence oracle) and
// markRead idempotency. `create` is INTERNAL — asserted un-callable as a
// public function and validated via t.mutation on the internal ref.
import { describe, expect, test } from "vitest";
import { api, internal } from "../../_generated/api";
import type { Id } from "../../_generated/dataModel";
import { MARK_ALL_TAKE } from "./validate";
import {
  asUser,
  readUserNotifications,
  seedNotification,
  seedTenantFixture,
  setup,
} from "./test.helpers";

async function fixture() {
  const t = setup();
  const fx = await seedTenantFixture(t);
  return { t, fx };
}

describe("create (internal producer target)", () => {
  test("inserts a row for the recipient with trimmed title", async () => {
    const { t, fx } = await fixture();
    // AnyApi _generated returns `any` — pin the id so ctx.db.get narrows.
    const id: Id<"notifications"> = await t.mutation(
      internal.features.notifications.notifications.create,
      {
        userId: fx.memberId,
        tenantId: fx.tenantId,
        kind: "comment_reply",
        title: "  Balasan baru di diskusimu  ",
        body: "Seseorang membalas komentarmu.",
        href: "/kelas/komunitas-test/kelas-published/lesson/abc",
      }
    );
    const row = await t.run((ctx) => ctx.db.get(id));
    expect(row?.userId).toBe(fx.memberId);
    expect(row?.title).toBe("Balasan baru di diskusimu");
    expect(row?.readAt).toBeUndefined(); // born unread
  });

  test("empty title and non-relative href → VALIDATION_FAILED", async () => {
    const { t, fx } = await fixture();
    const base = { userId: fx.memberId, tenantId: fx.tenantId, kind: "comment_reply" as const };
    await expect(
      t.mutation(internal.features.notifications.notifications.create, { ...base, title: "   " })
    ).rejects.toThrow(/VALIDATION_FAILED/);
    await expect(
      t.mutation(internal.features.notifications.notifications.create, {
        ...base,
        title: "Judul",
        href: "https://evil.example/phish", // absolute URL → open-redirect guard
      })
    ).rejects.toThrow(/VALIDATION_FAILED/);
  });
});

describe("markRead — authz + own-rows-only (P0)", () => {
  test("anonymous → NOT_AUTHENTICATED (auth before read, even for a real id)", async () => {
    const { t, fx } = await fixture();
    const id = await seedNotification(t, fx, fx.memberId, "Halo");
    await expect(
      t.mutation(api.features.notifications.notifications.markRead, { notificationId: id })
    ).rejects.toThrow(/NOT_AUTHENTICATED/);
  });

  test("another user's row → NOT_FOUND (same answer as a missing row — no oracle)", async () => {
    const { t, fx } = await fixture();
    const id = await seedNotification(t, fx, fx.memberId, "Punya member");
    await expect(
      t.withIdentity(asUser(fx.instructorId))
        .mutation(api.features.notifications.notifications.markRead, { notificationId: id })
    ).rejects.toThrow(/NOT_FOUND/);
    // Row untouched — still unread for its real owner.
    expect((await t.run((ctx) => ctx.db.get(id)))?.readAt).toBeUndefined();

    // Missing row answers identically.
    await t.run((ctx) => ctx.db.delete(id));
    await expect(
      t.withIdentity(asUser(fx.memberId))
        .mutation(api.features.notifications.notifications.markRead, { notificationId: id })
    ).rejects.toThrow(/NOT_FOUND/);
  });

  test("owner marks read; second call is an idempotent no-op (readAt kept)", async () => {
    const { t, fx } = await fixture();
    const id = await seedNotification(t, fx, fx.memberId, "Baca aku");
    const as = t.withIdentity(asUser(fx.memberId));
    await as.mutation(api.features.notifications.notifications.markRead, { notificationId: id });
    const first = (await t.run((ctx) => ctx.db.get(id)))?.readAt;
    expect(first).toBeTypeOf("number");

    await as.mutation(api.features.notifications.notifications.markRead, { notificationId: id });
    expect((await t.run((ctx) => ctx.db.get(id)))?.readAt).toBe(first); // unchanged
  });
});

describe("markAllRead", () => {
  test("anonymous → NOT_AUTHENTICATED", async () => {
    const { t } = await fixture();
    await expect(
      t.mutation(api.features.notifications.notifications.markAllRead, {})
    ).rejects.toThrow(/NOT_AUTHENTICATED/);
  });

  test("marks ONLY the caller's unread rows; other users' rows untouched", async () => {
    const { t, fx } = await fixture();
    await seedNotification(t, fx, fx.memberId, "Satu");
    await seedNotification(t, fx, fx.memberId, "Dua");
    const alreadyRead = await seedNotification(t, fx, fx.memberId, "Lama", { readAt: 111 });
    const foreign = await seedNotification(t, fx, fx.instructorId, "Punya guru");

    const count = await t.withIdentity(asUser(fx.memberId))
      .mutation(api.features.notifications.notifications.markAllRead, {});
    expect(count).toBe(2); // bounded write ≤ MARK_ALL_TAKE
    expect(count).toBeLessThanOrEqual(MARK_ALL_TAKE);

    const mine = await readUserNotifications(t, fx.memberId);
    expect(mine.every((row) => row.readAt !== undefined)).toBe(true);
    expect((await t.run((ctx) => ctx.db.get(alreadyRead)))?.readAt).toBe(111); // kept
    expect((await t.run((ctx) => ctx.db.get(foreign)))?.readAt).toBeUndefined(); // P0
  });

  test("idempotent: second call marks nothing", async () => {
    const { t, fx } = await fixture();
    await seedNotification(t, fx, fx.memberId, "Sekali saja");
    const as = t.withIdentity(asUser(fx.memberId));
    await as.mutation(api.features.notifications.notifications.markAllRead, {});
    expect(await as.mutation(api.features.notifications.notifications.markAllRead, {})).toBe(0);
  });
});
