import { afterEach, expect, test, vi } from "vitest";
import { api } from "../../_generated/api";
import { hashMcpToken } from "./crypto";
import { setupMcp } from "./test.helpers";

afterEach(() => vi.restoreAllMocks());

test("issuer rejects anonymous/admin scope without true platform flag and persists only a digest", async () => {
  const { t, member, other, memberId, userToken } = await setupMcp();
  await expect(t.action(api.features.mcp.tokens.issue, { scope: "user", label: "Anon", ttlDays: 7 })).rejects.toThrow(/NOT_AUTHENTICATED/);
  for (const caller of [member, other]) await expect(caller.action(api.features.mcp.tokens.issue, { scope: "admin", label: "Escalation", ttlDays: 7 })).rejects.toThrow(/NOT_AUTHORIZED/);
  const stored = await t.run(ctx => ctx.db.get(userToken.tokenId));
  expect(stored?.tokenHash).toBe(await hashMcpToken(userToken.token));
  expect(stored?.userId).toBe(memberId);
  expect(JSON.stringify(stored)).not.toContain(userToken.token);
  for (const derived of [stored!.tokenHash, `study_mcp_user_${stored!.tokenHash}`]) await expect(t.action(api.features.mcp.bridge.authenticate, { token: derived, scope: "user" })).rejects.toThrow(/NOT_AUTHENTICATED/);
  const list = await member.query(api.features.mcp.tokens.list, {});
  expect(list).toHaveLength(1);
  expect(list[0]).toMatchObject({ tokenId: userToken.tokenId, scope: "user", expired: false, lastUsedAt: null });
  expect(JSON.stringify(list)).not.toContain("tokenHash");
  expect(JSON.stringify(list)).not.toContain(userToken.token);
  await expect(t.query(api.features.mcp.tokens.list, {})).rejects.toThrow(/NOT_AUTHENTICATED/);
});

test("revoke is caller-owned, idempotent and immediately invalidates reads and writes", async () => {
  const { t, member, other, userToken, lessonId } = await setupMcp();
  await expect(other.mutation(api.features.mcp.tokens.revoke, { tokenId: userToken.tokenId })).rejects.toThrow(/NOT_AUTHORIZED/);
  await expect(t.mutation(api.features.mcp.tokens.revoke, { tokenId: userToken.tokenId })).rejects.toThrow(/NOT_AUTHENTICATED/);
  expect(await member.mutation(api.features.mcp.tokens.revoke, { tokenId: userToken.tokenId })).toEqual({ revoked: true });
  expect(await member.mutation(api.features.mcp.tokens.revoke, { tokenId: userToken.tokenId })).toEqual({ revoked: false });
  for (const capability of ["user.lesson", "user.complete_lesson"]) {
    await expect(t.action(api.features.mcp.bridge.execute, { token: userToken.token, scope: "user", capability, argumentsJson: JSON.stringify({ lessonId }) })).rejects.toThrow(/NOT_AUTHENTICATED/);
  }
});

test("wrong endpoint, expired token, deleted user and downgraded administrator all fail", async () => {
  const { t, userToken, adminToken, adminProfileId, memberId } = await setupMcp();
  await expect(t.action(api.features.mcp.bridge.authenticate, { token: userToken.token, scope: "admin" })).rejects.toThrow(/NOT_AUTHORIZED/);
  await expect(t.action(api.features.mcp.bridge.authenticate, { token: adminToken.token, scope: "user" })).rejects.toThrow(/NOT_AUTHORIZED/);
  await t.run(ctx => ctx.db.patch(adminProfileId, { isPlatformAdmin: false }));
  await expect(t.action(api.features.mcp.bridge.discover, { token: adminToken.token, scope: "admin" })).rejects.toThrow(/NOT_AUTHORIZED/);
  await t.run(ctx => ctx.db.patch(userToken.tokenId, { expiresAt: Date.now() }));
  await expect(t.action(api.features.mcp.bridge.authenticate, { token: userToken.token, scope: "user" })).rejects.toThrow(/NOT_AUTHENTICATED/);
  await t.run(async ctx => { await ctx.db.patch(userToken.tokenId, { expiresAt: Date.now() + 60_000 }); await ctx.db.delete(memberId); });
  await expect(t.action(api.features.mcp.bridge.authenticate, { token: userToken.token, scope: "user" })).rejects.toThrow(/NOT_AUTHENTICATED/);
  await expect(t.action(api.features.mcp.bridge.authenticate, { token: "not-a-token", scope: "user" })).rejects.toThrow(/NOT_AUTHENTICATED/);
});

test("20 stored token cap is bounded and revocation frees capacity", async () => {
  const { member, userToken } = await setupMcp();
  for (let i = 1; i < 20; i++) await member.action(api.features.mcp.tokens.issue, { scope: "user", label: `Client ${i}`, ttlDays: 7 });
  await expect(member.action(api.features.mcp.tokens.issue, { scope: "user", label: "Over cap", ttlDays: 7 })).rejects.toThrow(/RATE_LIMITED/);
  await member.mutation(api.features.mcp.tokens.revoke, { tokenId: userToken.tokenId });
  await expect(member.action(api.features.mcp.tokens.issue, { scope: "user", label: "Replacement", ttlDays: 90 })).resolves.toMatchObject({ token: expect.any(String) });
});

test("usage limits enforce minute/day caps and never extend expiration", async () => {
  const { t, userToken } = await setupMcp();
  const spy = vi.spyOn(Date, "now").mockReturnValue(Date.parse("2026-10-03T08:00:00Z"));
  await t.run(ctx => ctx.db.patch(userToken.tokenId, { expiresAt: Date.now() + 7 * 86_400_000 }));
  const expiresAt = (await t.run(ctx => ctx.db.get(userToken.tokenId)))!.expiresAt;
  for (let i = 0; i < 120; i++) await t.action(api.features.mcp.bridge.authenticate, { token: userToken.token, scope: "user" });
  await expect(t.action(api.features.mcp.bridge.authenticate, { token: userToken.token, scope: "user" })).rejects.toThrow(/RATE_LIMITED/);
  spy.mockReturnValue(Date.now() + 60_000);
  await expect(t.action(api.features.mcp.bridge.authenticate, { token: userToken.token, scope: "user" })).resolves.toEqual({ scope: "user" });
  await t.run(ctx => ctx.db.patch(userToken.tokenId, { dayCount: 2_000 }));
  await expect(t.action(api.features.mcp.bridge.authenticate, { token: userToken.token, scope: "user" })).rejects.toThrow(/RATE_LIMITED/);
  spy.mockReturnValue(Date.now() + 86_400_000);
  await expect(t.action(api.features.mcp.bridge.authenticate, { token: userToken.token, scope: "user" })).resolves.toEqual({ scope: "user" });
  const row = await t.run(ctx => ctx.db.get(userToken.tokenId));
  expect(row?.expiresAt).toBe(expiresAt);
  expect(row?.lastUsedAt).toBe(Date.now());
});
