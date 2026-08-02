/// <reference types="vite/client" />
// resources feature — suggestion vote specs (#18). Covers: denied paths (anon /
// outsider / cross-tenant member), authz ORDER (dangling id → NOT_AUTHENTICATED,
// never NOT_FOUND), toggle idempotency + double-vote impossibility on the
// by_suggestion_user unique path, derived count correctness, and the
// voteCount-desc-then-newest sort of both list queries.
import { expect, test } from "vitest";
import type { Id } from "../../_generated/dataModel";
import { api } from "../../_generated/api";
import {
  asUser,
  seedOtherTenantMember,
  seedSuggestion,
  seedTenantFixture,
  seedVote,
  setup,
  type T,
} from "./test.helpers";

/** All vote rows for a suggestion (test-side read, bounded fixture data). */
async function voteRows(t: T, suggestionId: Id<"suggestions">) {
  return t.run((ctx) =>
    ctx.db
      .query("suggestionVotes")
      .withIndex("by_suggestion", (q) => q.eq("suggestionId", suggestionId))
      .take(50)
  );
}

// ── toggleVote: happy path + idempotency ──────────────────────────────────

test("toggleVote: member votes → row inserted with tenantId from the SUGGESTION row", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const suggestionId = await seedSuggestion(t, fx, "open", fx.member2Id);

  const result = await t
    .withIdentity(asUser(fx.memberId))
    .mutation(api.features.resources.votes.toggleVote, { suggestionId });
  expect(result).toEqual({ voted: true });

  const rows = await voteRows(t, suggestionId);
  expect(rows).toHaveLength(1);
  expect(rows[0].userId).toBe(fx.memberId);
  expect(rows[0].tenantId).toBe(fx.tenantId); // from the suggestion row, not args
});

test("toggleVote: idempotent — on → off → on yields 1 → 0 → 1 rows", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const suggestionId = await seedSuggestion(t, fx, "open", fx.member2Id);
  const as = t.withIdentity(asUser(fx.memberId));

  expect(await as.mutation(api.features.resources.votes.toggleVote, { suggestionId })).toEqual({ voted: true });
  expect(await voteRows(t, suggestionId)).toHaveLength(1);

  expect(await as.mutation(api.features.resources.votes.toggleVote, { suggestionId })).toEqual({ voted: false });
  expect(await voteRows(t, suggestionId)).toHaveLength(0);

  expect(await as.mutation(api.features.resources.votes.toggleVote, { suggestionId })).toEqual({ voted: true });
  expect(await voteRows(t, suggestionId)).toHaveLength(1);
});

test("toggleVote: double vote impossible — repeated calls never yield 2 rows for one user", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const suggestionId = await seedSuggestion(t, fx, "open", fx.instructorId);
  await seedVote(t, fx, suggestionId, fx.member2Id); // someone else's vote stays

  const as = t.withIdentity(asUser(fx.memberId));
  await as.mutation(api.features.resources.votes.toggleVote, { suggestionId }); // on
  await as.mutation(api.features.resources.votes.toggleVote, { suggestionId }); // off (not a 2nd row)

  const rows = await voteRows(t, suggestionId);
  expect(rows).toHaveLength(1); // only member2's untouched vote remains
  expect(rows[0].userId).toBe(fx.member2Id);
});

// ── toggleVote: denied paths (P0) ─────────────────────────────────────────

test("toggleVote: anonymous → NOT_AUTHENTICATED; outsider → NOT_AUTHORIZED", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const suggestionId = await seedSuggestion(t, fx, "open", fx.memberId);

  await expect(
    t.mutation(api.features.resources.votes.toggleVote, { suggestionId })
  ).rejects.toThrow(/NOT_AUTHENTICATED/);
  await expect(
    t
      .withIdentity(asUser(fx.outsiderId))
      .mutation(api.features.resources.votes.toggleVote, { suggestionId })
  ).rejects.toThrow(/NOT_AUTHORIZED/);
  expect(await voteRows(t, suggestionId)).toHaveLength(0);
});

test("toggleVote: member of ANOTHER tenant → NOT_AUTHORIZED (cross-tenant rejection)", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const { otherMemberId } = await seedOtherTenantMember(t);
  const suggestionId = await seedSuggestion(t, fx, "open", fx.memberId);

  await expect(
    t
      .withIdentity(asUser(otherMemberId))
      .mutation(api.features.resources.votes.toggleVote, { suggestionId })
  ).rejects.toThrow(/NOT_AUTHORIZED/);
  expect(await voteRows(t, suggestionId)).toHaveLength(0);
});

test("toggleVote: anonymous + dangling suggestionId → NOT_AUTHENTICATED (never NOT_FOUND)", async () => {
  // Authz-ORDER regression (pattern: authz-order.test.ts): read-first code would
  // resolve the deleted id → NOT_FOUND, an existence oracle for anonymous callers.
  const t = setup();
  const fx = await seedTenantFixture(t);
  const suggestionId = await seedSuggestion(t, fx, "open", fx.memberId);
  await t.run((ctx) => ctx.db.delete(suggestionId));

  await expect(
    t.mutation(api.features.resources.votes.toggleVote, { suggestionId })
  ).rejects.toThrow(/NOT_AUTHENTICATED/);
});

// ── list enrichment: count correctness + sort ─────────────────────────────

test("listOpenSuggestions: voteCount + myVote correct; sorted voteCount desc then newest", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  // Insert order = creation order: A oldest … D newest.
  const a = await seedSuggestion(t, fx, "open", fx.memberId, "A dua suara");
  const b = await seedSuggestion(t, fx, "open", fx.memberId, "B satu suara");
  const c = await seedSuggestion(t, fx, "open", fx.memberId, "C nol lama");
  const d = await seedSuggestion(t, fx, "open", fx.memberId, "D nol baru");
  await seedVote(t, fx, a, fx.memberId);
  await seedVote(t, fx, a, fx.member2Id);
  await seedVote(t, fx, b, fx.memberId);

  const list = await t
    .withIdentity(asUser(fx.memberId))
    .query(api.features.resources.queries.listOpenSuggestions, { tenantId: fx.tenantId });

  // Sort: A(2) → B(1) → ties on 0 newest-first: D then C.
  expect(list.map((s: { _id: string }) => s._id)).toEqual([a, b, d, c]);
  const byId = new Map(list.map((s: { _id: string }) => [s._id, s] as const));
  expect(byId.get(a)).toMatchObject({ voteCount: 2, myVote: true });
  expect(byId.get(b)).toMatchObject({ voteCount: 1, myVote: true });
  expect(byId.get(d)).toMatchObject({ voteCount: 0, myVote: false });

  // myVote is PER CALLER: member2 voted only on A.
  const list2 = await t
    .withIdentity(asUser(fx.member2Id))
    .query(api.features.resources.queries.listOpenSuggestions, { tenantId: fx.tenantId });
  const byId2 = new Map(list2.map((s: { _id: string }) => [s._id, s] as const));
  expect(byId2.get(a)).toMatchObject({ voteCount: 2, myVote: true });
  expect(byId2.get(b)).toMatchObject({ voteCount: 1, myVote: false });
});

test("listMineSuggestions: carries voteCount/myVote and keeps ownership scoping", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const mineId = await seedSuggestion(t, fx, "planned", fx.memberId, "Punyaku");
  await seedSuggestion(t, fx, "open", fx.member2Id, "Punya orang lain");
  await seedVote(t, fx, mineId, fx.member2Id); // someone else voted on mine

  const mine = await t
    .withIdentity(asUser(fx.memberId))
    .query(api.features.resources.queries.listMineSuggestions, { tenantId: fx.tenantId });

  expect(mine).toHaveLength(1);
  expect(mine[0]).toMatchObject({ title: "Punyaku", voteCount: 1, myVote: false });
});
