/// <reference types="vite/client" />
// resources feature — suggestion submit / triage / read specs. Denied paths for
// every function, anti-spam cap, and the ownership scoping of listMine.
import { expect, test } from "vitest";
import type { Id } from "../../_generated/dataModel";
import { api } from "../../_generated/api";
import { asUser, seedSuggestion, seedTenantFixture, setup } from "./test.helpers";

const openArgs = (tenantId: string) => ({
  tenantId: tenantId as never,
  title: "Kelas Fine-tuning LLM",
});

// ── submit ────────────────────────────────────────────────────────────────

test("submit: member creates an OPEN suggestion owned by ctx user", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const id = await t
    .withIdentity(asUser(fx.memberId))
    .mutation(api.features.resources.suggestions.submit, openArgs(fx.tenantId));

  const row = await t.run((ctx) => ctx.db.get(id as Id<"suggestions">));
  expect(row?.status).toBe("open");
  expect(row?.submittedBy).toBe(fx.memberId);
});

test("submit: anonymous → NOT_AUTHENTICATED; outsider → NOT_AUTHORIZED", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  await expect(
    t.mutation(api.features.resources.suggestions.submit, openArgs(fx.tenantId))
  ).rejects.toThrow(/NOT_AUTHENTICATED/);
  await expect(
    t
      .withIdentity(asUser(fx.outsiderId))
      .mutation(api.features.resources.suggestions.submit, openArgs(fx.tenantId))
  ).rejects.toThrow(/NOT_AUTHORIZED/);
});

test("submit: anti-spam — 6th open suggestion → RATE_LIMITED", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  for (let i = 0; i < 5; i++) {
    await seedSuggestion(t, fx, "open", fx.memberId, `Open ${i}`);
  }
  await expect(
    t
      .withIdentity(asUser(fx.memberId))
      .mutation(api.features.resources.suggestions.submit, openArgs(fx.tenantId))
  ).rejects.toThrow(/RATE_LIMITED/);
});

// ── setStatus ───────────────────────────────────────────────────────────────

test("setStatus: instructor triages open → planned", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const id = await seedSuggestion(t, fx, "open", fx.memberId);
  await t
    .withIdentity(asUser(fx.instructorId))
    .mutation(api.features.resources.suggestions.setStatus, { suggestionId: id, status: "planned" });

  const row = await t.run((ctx) => ctx.db.get(id as Id<"suggestions">));
  expect(row?.status).toBe("planned");
});

test("setStatus: member cannot triage → NOT_AUTHORIZED; anonymous → NOT_AUTHENTICATED", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const id = await seedSuggestion(t, fx, "open", fx.memberId);
  await expect(
    t
      .withIdentity(asUser(fx.member2Id))
      .mutation(api.features.resources.suggestions.setStatus, { suggestionId: id, status: "done" })
  ).rejects.toThrow(/NOT_AUTHORIZED/);
  await expect(
    t.mutation(api.features.resources.suggestions.setStatus, { suggestionId: id, status: "done" })
  ).rejects.toThrow(/NOT_AUTHENTICATED/);
});

// ── reads ────────────────────────────────────────────────────────────────

test("listOpenSuggestions: member sees open only; outsider → NOT_AUTHORIZED", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  await seedSuggestion(t, fx, "open", fx.memberId, "Masih terbuka");
  await seedSuggestion(t, fx, "done", fx.memberId, "Sudah selesai");

  const list = await t
    .withIdentity(asUser(fx.member2Id))
    .query(api.features.resources.queries.listOpenSuggestions, { tenantId: fx.tenantId });
  const titles = list.map((s: any) => s.title);
  expect(titles).toContain("Masih terbuka");
  expect(titles).not.toContain("Sudah selesai");

  await expect(
    t
      .withIdentity(asUser(fx.outsiderId))
      .query(api.features.resources.queries.listOpenSuggestions, { tenantId: fx.tenantId })
  ).rejects.toThrow(/NOT_AUTHORIZED/);
});

test("listMineSuggestions: submitter sees own (any status); another member does not", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  await seedSuggestion(t, fx, "planned", fx.memberId, "Punyaku");

  const mine = await t
    .withIdentity(asUser(fx.memberId))
    .query(api.features.resources.queries.listMineSuggestions, { tenantId: fx.tenantId });
  expect(mine.map((s: any) => s.title)).toContain("Punyaku");

  const others = await t
    .withIdentity(asUser(fx.member2Id))
    .query(api.features.resources.queries.listMineSuggestions, { tenantId: fx.tenantId });
  expect(others).toHaveLength(0);
});
