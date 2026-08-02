/// <reference types="vite/client" />
// Shared fixture for announcements convex-test specs (pattern:
// convex/features/courses/test.helpers.ts). Roles: owner / instructor / member /
// outsider (no membership) — every spec exercises the authz-denied path (P0).
import { convexTest } from "convex-test";
import { makeFunctionReference } from "convex/server";
import type { Id } from "../../_generated/dataModel";
import schema from "../../schema";

// Public fn refs by path — the strict checked-in api.d.ts has no `announcements`
// entry yet (regen is integrator-only), so specs reference by path exactly as
// the server code does (see ./refs.ts). Resolves at runtime in convex-test.
export const createRef = makeFunctionReference<
  "mutation",
  { tenantId: Id<"tenants">; title: string; bodyMd: string }
>("features/announcements/mutations:create");
export const listRef = makeFunctionReference<"query", { tenantId: Id<"tenants"> }>(
  "features/announcements/queries:list"
);

// Absolute glob keeps every key rooted at /convex so convex-test resolves nested
// function paths (and scheduled internal fns) consistently from this helper.
export const modules = import.meta.glob([
  "/convex/**/*.{js,ts}",
  "!/convex/**/*.test.ts",
  "!/convex/**/*.d.ts",
]);

export function setup() {
  return convexTest(schema, modules);
}

export type T = ReturnType<typeof setup>;

/** @convex-dev/auth identity: JWT subject is `${userId}|${sessionId}`. */
export function asUser(userId: Id<"users">) {
  return { subject: `${userId}|test-session` };
}

/** A real Discord-shaped webhook URL — used to prove it never leaks in reads. */
export const TEST_WEBHOOK_URL =
  "https://discord.com/api/webhooks/123456789012345678/abcdefGHIJklmnop-QRStuvwxyz";

export type TenantFixture = {
  tenantId: Id<"tenants">;
  ownerId: Id<"users">;
  instructorId: Id<"users">;
  memberId: Id<"users">;
  outsiderId: Id<"users">;
};

/** Active tenant + one user per role (outsider has NO membership). */
export async function seedTenantFixture(
  t: T,
  opts: { withWebhook?: boolean } = {}
): Promise<TenantFixture> {
  return await t.run(async (ctx) => {
    const ownerId = await ctx.db.insert("users", { email: "owner@test.id" });
    const instructorId = await ctx.db.insert("users", { email: "guru@test.id" });
    const memberId = await ctx.db.insert("users", { email: "member@test.id" });
    const outsiderId = await ctx.db.insert("users", { email: "luar@test.id" });
    const tenantId = await ctx.db.insert("tenants", {
      slug: "komunitas-test",
      name: "Komunitas Test",
      description: "Tenant fixture untuk spec announcements",
      status: "active",
      ownerId,
      ...(opts.withWebhook ? { discordWebhookUrl: TEST_WEBHOOK_URL } : {}),
    });
    await ctx.db.insert("memberships", { tenantId, userId: ownerId, role: "owner" });
    await ctx.db.insert("memberships", { tenantId, userId: instructorId, role: "instructor" });
    await ctx.db.insert("memberships", { tenantId, userId: memberId, role: "member" });
    return { tenantId, ownerId, instructorId, memberId, outsiderId };
  });
}

/** Insert an announcement row directly (bypasses authz) for read specs. */
export async function seedAnnouncement(
  t: T,
  fx: TenantFixture,
  overrides: { title?: string; bodyMd?: string; postedToDiscord?: boolean } = {}
): Promise<Id<"announcements">> {
  return await t.run(async (ctx) =>
    ctx.db.insert("announcements", {
      tenantId: fx.tenantId,
      title: overrides.title ?? "Pengumuman uji",
      bodyMd: overrides.bodyMd ?? "Isi pengumuman uji.",
      createdBy: fx.instructorId,
      postedToDiscord: overrides.postedToDiscord ?? false,
    })
  );
}
