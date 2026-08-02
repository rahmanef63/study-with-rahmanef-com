/// <reference types="vite/client" />
// createMany specs (#28, wave v1.4): the bounded fan-out target. Asserts:
// (1) one row per recipient with the shared payload, born unread; (2) the
// hard cap (CREATE_MANY_CAP=200) — 201 recipients fail VALIDATION_FAILED with
// ZERO rows inserted; exactly 200 succeed; (3) title/href validation is the
// SAME helper `create` uses (bad payload → zero rows, no partial fan-out).
// createMany is INTERNAL (internalMutation) — un-callable from clients;
// specs drive it via makeFunctionReference like every producer does.
import { expect, test } from "vitest";
import type { Id } from "../../_generated/dataModel";
import { createManyNotificationsRef } from "./refs";
import {
  readUserNotifications,
  seedTenantFixture,
  setup,
  type T,
  type TenantFixture,
} from "./test.helpers";
import { CREATE_MANY_CAP } from "./validate";

/** Insert N extra users (no memberships needed — createMany trusts producers). */
async function seedUsers(t: T, n: number): Promise<Id<"users">[]> {
  return await t.run(async (ctx) => {
    const ids: Id<"users">[] = [];
    for (let i = 0; i < n; i++) {
      ids.push(await ctx.db.insert("users", { email: `extra-${i}@test.id` }));
    }
    return ids;
  });
}

function baseArgs(fx: TenantFixture, recipientIds: Id<"users">[]) {
  return {
    tenantId: fx.tenantId,
    kind: "announcement" as const,
    title: "Pengumuman baru",
    href: "/pengumuman/komunitas-test",
    recipientIds,
  };
}

test("inserts ONE unread row per recipient with the shared payload", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const inserted = await t.mutation(
    createManyNotificationsRef,
    baseArgs(fx, [fx.ownerId, fx.memberId])
  );
  expect(inserted).toBe(2);

  for (const userId of [fx.ownerId, fx.memberId]) {
    const rows = await readUserNotifications(t, userId);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.kind).toBe("announcement");
    expect(rows[0]?.tenantId).toBe(fx.tenantId);
    expect(rows[0]?.title).toBe("Pengumuman baru");
    expect(rows[0]?.href).toBe("/pengumuman/komunitas-test");
    expect(rows[0]?.readAt).toBeUndefined(); // born unread
  }
  // Not in the list → no row.
  expect(await readUserNotifications(t, fx.instructorId)).toHaveLength(0);
});

test(`cap: ${CREATE_MANY_CAP} recipients succeed; one more → VALIDATION_FAILED, zero rows`, async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const over = await seedUsers(t, CREATE_MANY_CAP + 1);

  await expect(t.mutation(createManyNotificationsRef, baseArgs(fx, over))).rejects.toThrow(
    /VALIDATION_FAILED/
  );
  // No partial fan-out: NOTHING was inserted for anyone.
  expect(await readUserNotifications(t, over[0]!)).toHaveLength(0);
  expect(await readUserNotifications(t, over[over.length - 1]!)).toHaveLength(0);

  const atCap = over.slice(0, CREATE_MANY_CAP);
  expect(await t.mutation(createManyNotificationsRef, baseArgs(fx, atCap))).toBe(
    CREATE_MANY_CAP
  );
  expect(await readUserNotifications(t, atCap[0]!)).toHaveLength(1);
  expect(await readUserNotifications(t, atCap[CREATE_MANY_CAP - 1]!)).toHaveLength(1);
});

test("shared validation: blank title / external href → VALIDATION_FAILED, zero rows", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);

  await expect(
    t.mutation(createManyNotificationsRef, {
      ...baseArgs(fx, [fx.memberId]),
      title: "   ",
    })
  ).rejects.toThrow(/VALIDATION_FAILED/);

  await expect(
    t.mutation(createManyNotificationsRef, {
      ...baseArgs(fx, [fx.memberId]),
      href: "https://evil.example.com/phish", // absolute URL — open-redirect guard
    })
  ).rejects.toThrow(/VALIDATION_FAILED/);

  expect(await readUserNotifications(t, fx.memberId)).toHaveLength(0);
});

test("empty recipient list is a harmless no-op (returns 0)", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  expect(await t.mutation(createManyNotificationsRef, baseArgs(fx, []))).toBe(0);
});
