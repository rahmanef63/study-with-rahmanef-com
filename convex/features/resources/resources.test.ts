/// <reference types="vite/client" />
// resources feature — resource submit / curate / read specs. Every function is
// exercised on its authz-denied path (unauthenticated + wrong-role), plus the
// P0 visibility invariant: a plain member NEVER sees another member's pending
// item, and the anti-spam cap (RATE_LIMITED).
import { expect, test } from "vitest";
import type { Id } from "../../_generated/dataModel";
import { api } from "../../_generated/api";
import {
  asUser,
  seedResource,
  seedTenantFixture,
  setup,
} from "./test.helpers";

const submitArgs = (tenantId: string) => ({
  tenantId: tenantId as never,
  title: "Panduan Prompt Engineering",
  url: "https://example.com/prompt",
});

// ── submit ────────────────────────────────────────────────────────────────

test("submit: member creates a PENDING resource owned by ctx user", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const id = await t
    .withIdentity(asUser(fx.memberId))
    .mutation(api.features.resources.resources.submit, submitArgs(fx.tenantId));

  const row = await t.run((ctx) => ctx.db.get(id as Id<"resources">));
  expect(row?.status).toBe("pending");
  expect(row?.submittedBy).toBe(fx.memberId);
  expect(row?.reviewedBy).toBeUndefined();
});

test("submit: anonymous → NOT_AUTHENTICATED", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  await expect(
    t.mutation(api.features.resources.resources.submit, submitArgs(fx.tenantId))
  ).rejects.toThrow(/NOT_AUTHENTICATED/);
});

test("submit: outsider (no membership) → NOT_AUTHORIZED", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  await expect(
    t
      .withIdentity(asUser(fx.outsiderId))
      .mutation(api.features.resources.resources.submit, submitArgs(fx.tenantId))
  ).rejects.toThrow(/NOT_AUTHORIZED/);
});

test("submit: non-http(s) url → VALIDATION_FAILED (blocks javascript: scheme)", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  await expect(
    t.withIdentity(asUser(fx.memberId)).mutation(api.features.resources.resources.submit, {
      tenantId: fx.tenantId,
      title: "Jahat",
      url: "javascript:alert(1)",
    })
  ).rejects.toThrow(/VALIDATION_FAILED/);
});

test("submit: anti-spam — 6th pending item → RATE_LIMITED", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  for (let i = 0; i < 5; i++) {
    await seedResource(t, fx, "pending", fx.memberId, `Pending ${i}`);
  }
  await expect(
    t
      .withIdentity(asUser(fx.memberId))
      .mutation(api.features.resources.resources.submit, submitArgs(fx.tenantId))
  ).rejects.toThrow(/RATE_LIMITED/);

  // The cap is per-user: a different member is unaffected.
  const ok = await t
    .withIdentity(asUser(fx.member2Id))
    .mutation(api.features.resources.resources.submit, submitArgs(fx.tenantId));
  expect(ok).toBeTruthy();
});

// ── curate ────────────────────────────────────────────────────────────────

test("curate: instructor approves → status approved + reviewedBy recorded", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const id = await seedResource(t, fx, "pending", fx.memberId);
  await t
    .withIdentity(asUser(fx.instructorId))
    .mutation(api.features.resources.resources.curate, { resourceId: id, decision: "approved" });

  const row = await t.run((ctx) => ctx.db.get(id as Id<"resources">));
  expect(row?.status).toBe("approved");
  expect(row?.reviewedBy).toBe(fx.instructorId);
});

test("curate: member cannot approve → NOT_AUTHORIZED", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const id = await seedResource(t, fx, "pending", fx.memberId);
  await expect(
    t
      .withIdentity(asUser(fx.memberId))
      .mutation(api.features.resources.resources.curate, { resourceId: id, decision: "approved" })
  ).rejects.toThrow(/NOT_AUTHORIZED/);
});

test("curate: anonymous → NOT_AUTHENTICATED", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const id = await seedResource(t, fx, "pending", fx.memberId);
  await expect(
    t.mutation(api.features.resources.resources.curate, { resourceId: id, decision: "rejected" })
  ).rejects.toThrow(/NOT_AUTHENTICATED/);
});

// ── read visibility (the P0 invariant) ──────────────────────────────────────

test("listApprovedResources: member sees approved, NEVER pending", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  await seedResource(t, fx, "approved", fx.memberId, "Sudah disetujui");
  await seedResource(t, fx, "pending", fx.memberId, "Masih menunggu");

  const list = await t
    .withIdentity(asUser(fx.member2Id))
    .query(api.features.resources.queries.listApprovedResources, { tenantId: fx.tenantId });
  const titles = list.map((r: any) => r.title);
  expect(titles).toContain("Sudah disetujui");
  expect(titles).not.toContain("Masih menunggu");
});

test("listApprovedResources: outsider → NOT_AUTHORIZED; anonymous → NOT_AUTHENTICATED", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  await expect(
    t.query(api.features.resources.queries.listApprovedResources, { tenantId: fx.tenantId })
  ).rejects.toThrow(/NOT_AUTHENTICATED/);
  await expect(
    t
      .withIdentity(asUser(fx.outsiderId))
      .query(api.features.resources.queries.listApprovedResources, { tenantId: fx.tenantId })
  ).rejects.toThrow(/NOT_AUTHORIZED/);
});

test("listPendingResources: instructor sees pending; plain member → NOT_AUTHORIZED", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  await seedResource(t, fx, "pending", fx.memberId, "Antre review");

  const queue = await t
    .withIdentity(asUser(fx.instructorId))
    .query(api.features.resources.queries.listPendingResources, { tenantId: fx.tenantId });
  expect(queue.map((r: any) => r.title)).toContain("Antre review");
  expect(queue[0].submittedBy).toBe(fx.memberId);

  await expect(
    t
      .withIdentity(asUser(fx.member2Id))
      .query(api.features.resources.queries.listPendingResources, { tenantId: fx.tenantId })
  ).rejects.toThrow(/NOT_AUTHORIZED/);
});

test("listMineResources: submitter sees OWN pending; another member does not", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  await seedResource(t, fx, "pending", fx.memberId, "Punya member1");

  const mine = await t
    .withIdentity(asUser(fx.memberId))
    .query(api.features.resources.queries.listMineResources, { tenantId: fx.tenantId });
  expect(mine.map((r: any) => r.title)).toContain("Punya member1");

  const others = await t
    .withIdentity(asUser(fx.member2Id))
    .query(api.features.resources.queries.listMineResources, { tenantId: fx.tenantId });
  expect(others.map((r: any) => r.title)).not.toContain("Punya member1");
  expect(others).toHaveLength(0);
});
