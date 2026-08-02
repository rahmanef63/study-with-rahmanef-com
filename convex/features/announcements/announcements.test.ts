/// <reference types="vite/client" />
// announcements — authz-denied paths (P0, DoD §5.2), input validation, list
// ordering + safe-projection, and the webhook-never-in-results assertion (P0,
// DATA-MODEL security note #1).
import { expect, test } from "vitest";
import type { Id } from "../../_generated/dataModel";
import {
  asUser,
  createRef,
  listRef,
  seedAnnouncement,
  seedTenantFixture,
  setup,
  TEST_WEBHOOK_URL,
} from "./test.helpers";

// ---------------------------------------------------------------------------
// create — authz-denied paths (unauthenticated + every wrong role)
// ---------------------------------------------------------------------------

test("create: anonymous → NOT_AUTHENTICATED", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  await expect(
    t.mutation(createRef, { tenantId: fx.tenantId, title: "Halo semua", bodyMd: "Isi." })
  ).rejects.toThrow(/NOT_AUTHENTICATED/);
});

test("create: plain member → NOT_AUTHORIZED", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  await expect(
    t
      .withIdentity(asUser(fx.memberId))
      .mutation(createRef, { tenantId: fx.tenantId, title: "Halo semua", bodyMd: "Isi." })
  ).rejects.toThrow(/NOT_AUTHORIZED/);
});

test("create: non-member (outsider) → NOT_AUTHORIZED", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  await expect(
    t
      .withIdentity(asUser(fx.outsiderId))
      .mutation(createRef, { tenantId: fx.tenantId, title: "Halo semua", bodyMd: "Isi." })
  ).rejects.toThrow(/NOT_AUTHORIZED/);
});

test("create: instructor and owner succeed and default postedToDiscord=false", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t); // no webhook → action is a no-op
  const asInstructor = t.withIdentity(asUser(fx.instructorId));
  const r1 = await asInstructor.mutation(createRef, {
    tenantId: fx.tenantId,
    title: "Dari instruktur",
    bodyMd: "Isi pengumuman.",
  });
  const r2 = await t
    .withIdentity(asUser(fx.ownerId))
    .mutation(createRef, { tenantId: fx.tenantId, title: "Dari owner", bodyMd: "Isi." });

  expect(r1.announcementId).toBeDefined();
  await t.run(async (ctx) => {
    const a = await ctx.db.get(r1.announcementId as Id<"announcements">);
    expect(a?.postedToDiscord).toBe(false);
    expect(a?.createdBy).toBe(fx.instructorId);
    const b = await ctx.db.get(r2.announcementId as Id<"announcements">);
    expect(b?.tenantId).toBe(fx.tenantId);
  });
});

// ---------------------------------------------------------------------------
// create — validation (VALIDATION_FAILED)
// ---------------------------------------------------------------------------

test("create: blank title and empty body → VALIDATION_FAILED", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const asInstructor = t.withIdentity(asUser(fx.instructorId));
  await expect(
    asInstructor.mutation(createRef, { tenantId: fx.tenantId, title: "  ", bodyMd: "Isi." })
  ).rejects.toThrow(/VALIDATION_FAILED/);
  await expect(
    asInstructor.mutation(createRef, { tenantId: fx.tenantId, title: "Judul sah", bodyMd: "   " })
  ).rejects.toThrow(/VALIDATION_FAILED/);
});

// ---------------------------------------------------------------------------
// list — authz-denied paths + ordering + projection
// ---------------------------------------------------------------------------

test("list: anonymous → NOT_AUTHENTICATED; outsider → NOT_AUTHORIZED", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  await expect(t.query(listRef, { tenantId: fx.tenantId })).rejects.toThrow(/NOT_AUTHENTICATED/);
  await expect(
    t.withIdentity(asUser(fx.outsiderId)).query(listRef, { tenantId: fx.tenantId })
  ).rejects.toThrow(/NOT_AUTHORIZED/);
});

test("list: member sees announcements newest-first with the safe projection", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  await seedAnnouncement(t, fx, { title: "Lama" });
  await seedAnnouncement(t, fx, { title: "Baru" });

  const rows = await t
    .withIdentity(asUser(fx.memberId))
    .query(listRef, { tenantId: fx.tenantId });

  expect(rows).toHaveLength(2);
  expect(rows[0].title).toBe("Baru"); // newest first (order desc)
  expect(rows[1].title).toBe("Lama");
  // Exact projection contract — no extra/internal fields leak.
  expect(Object.keys(rows[0]).sort()).toEqual(
    ["_id", "bodyMd", "createdAt", "createdBy", "postedToDiscord", "tenantId", "title"].sort()
  );
});

// ---------------------------------------------------------------------------
// P0 — the tenant webhook URL never appears in any read result
// ---------------------------------------------------------------------------

test("list: webhook URL is NEVER present in the results (P0)", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t, { withWebhook: true });
  await seedAnnouncement(t, fx, { title: "Ada webhook" });

  const rows = await t
    .withIdentity(asUser(fx.memberId))
    .query(listRef, { tenantId: fx.tenantId });

  const serialized = JSON.stringify(rows);
  expect(serialized).not.toContain(TEST_WEBHOOK_URL);
  expect(serialized).not.toContain("discord.com/api/webhooks");
  for (const row of rows) {
    expect(row).not.toHaveProperty("discordWebhookUrl");
    expect(row).not.toHaveProperty("webhookUrl");
  }
});
