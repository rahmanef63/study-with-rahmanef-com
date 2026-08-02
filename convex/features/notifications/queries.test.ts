/// <reference types="vite/client" />
// Query specs for the notifications feature (#21). DoD §5.2 (P0): authz-denied
// paths + own-rows-only (a caller NEVER sees another user's rows), plus the
// contract details: unread-first ordering, bounded takes, safe projection
// (no raw docs — userId/tenantId never leave), capped unreadCount.
import { describe, expect, test } from "vitest";
import { api } from "../../_generated/api";
import type { NotificationItem } from "./projections";
import { UNREAD_COUNT_CAP, UNREAD_TAKE } from "./validate";
import { asUser, seedNotification, seedTenantFixture, setup } from "./test.helpers";

async function fixture() {
  const t = setup();
  const fx = await seedTenantFixture(t);
  return { t, fx };
}

describe("listMine — authz + own-rows-only (P0)", () => {
  test("anonymous → NOT_AUTHENTICATED", async () => {
    const { t } = await fixture();
    await expect(t.query(api.features.notifications.queries.listMine, {})).rejects.toThrow(
      /NOT_AUTHENTICATED/
    );
  });

  test("returns ONLY the caller's rows (another user's inbox never leaks)", async () => {
    const { t, fx } = await fixture();
    await seedNotification(t, fx, fx.memberId, "Milik member");
    await seedNotification(t, fx, fx.instructorId, "Milik guru");

    const mine: NotificationItem[] = await t.withIdentity(asUser(fx.memberId))
      .query(api.features.notifications.queries.listMine, {});
    expect(mine).toHaveLength(1);
    expect(mine[0]?.title).toBe("Milik member");

    // A user with no rows sees an empty inbox — not an error.
    const empty = await t.withIdentity(asUser(fx.outsiderId))
      .query(api.features.notifications.queries.listMine, {});
    expect(empty).toEqual([]);
  });

  test("unread-first, newest-first; read rows follow; safe projection shape", async () => {
    const { t, fx } = await fixture();
    const readOld = await seedNotification(t, fx, fx.memberId, "Dibaca", { readAt: 5 });
    await seedNotification(t, fx, fx.memberId, "Unread lama");
    await seedNotification(t, fx, fx.memberId, "Unread baru", {
      href: "/kelas/komunitas-test/kelas-published/lesson/x",
      body: "Isi",
    });

    const items: NotificationItem[] = await t.withIdentity(asUser(fx.memberId))
      .query(api.features.notifications.queries.listMine, {});
    expect(items.map((i) => i.title)).toEqual(["Unread baru", "Unread lama", "Dibaca"]);
    expect(items[0]?.readAt).toBeNull();
    expect(items[2]?._id).toBe(readOld);
    expect(items[2]?.readAt).toBe(5);

    // Safe projection: EXACTLY the public fields — never userId/tenantId/raw doc.
    expect(Object.keys(items[0] ?? {}).sort()).toEqual(
      ["_id", "body", "createdAt", "href", "kind", "readAt", "title"].sort()
    );
  });

  test("bounded: unread scan never exceeds UNREAD_TAKE", async () => {
    const { t, fx } = await fixture();
    for (let i = 0; i < UNREAD_TAKE + 5; i++) {
      await seedNotification(t, fx, fx.memberId, `N${i}`);
    }
    const items = await t.withIdentity(asUser(fx.memberId))
      .query(api.features.notifications.queries.listMine, {});
    expect(items).toHaveLength(UNREAD_TAKE); // no read rows seeded
  });
});

describe("unreadCount", () => {
  test("anonymous → NOT_AUTHENTICATED", async () => {
    const { t } = await fixture();
    await expect(t.query(api.features.notifications.queries.unreadCount, {})).rejects.toThrow(
      /NOT_AUTHENTICATED/
    );
  });

  test("counts ONLY the caller's UNREAD rows; capped at UNREAD_COUNT_CAP", async () => {
    const { t, fx } = await fixture();
    await seedNotification(t, fx, fx.memberId, "Unread");
    await seedNotification(t, fx, fx.memberId, "Read", { readAt: 7 });
    await seedNotification(t, fx, fx.instructorId, "Orang lain");

    expect(
      await t.withIdentity(asUser(fx.memberId))
        .query(api.features.notifications.queries.unreadCount, {})
    ).toBe(1);

    for (let i = 0; i < UNREAD_COUNT_CAP + 10; i++) {
      await seedNotification(t, fx, fx.outsiderId, `Banjir ${i}`);
    }
    expect(
      await t.withIdentity(asUser(fx.outsiderId))
        .query(api.features.notifications.queries.unreadCount, {})
    ).toBe(UNREAD_COUNT_CAP); // capped — the bell renders "99+"
  });
});
