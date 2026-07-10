/// <reference types="vite/client" />
// Shared fixture for resources convex-test specs (pattern:
// convex/features/courses/test.helpers.ts). Roles covered: owner / instructor /
// member / member2 / outsider (no membership) — every spec exercises the
// authz-denied path with these (DoD §5.2, P0).
import { convexTest } from "convex-test";
import type { Id } from "../../_generated/dataModel";
import schema from "../../schema";

// Absolute glob keeps every key rooted at /convex so convex-test can resolve
// nested function paths consistently from this nested helper.
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

export type TenantFixture = {
  tenantId: Id<"tenants">;
  ownerId: Id<"users">;
  instructorId: Id<"users">;
  memberId: Id<"users">;
  member2Id: Id<"users">;
  outsiderId: Id<"users">;
};

/** Active tenant + one user per role (outsider has NO membership). */
export async function seedTenantFixture(t: T): Promise<TenantFixture> {
  return await t.run(async (ctx) => {
    const ownerId = await ctx.db.insert("users", { email: "owner@test.id" });
    const instructorId = await ctx.db.insert("users", { email: "guru@test.id" });
    const memberId = await ctx.db.insert("users", { email: "member@test.id" });
    const member2Id = await ctx.db.insert("users", { email: "member2@test.id" });
    const outsiderId = await ctx.db.insert("users", { email: "luar@test.id" });
    const tenantId = await ctx.db.insert("tenants", {
      slug: "komunitas-test",
      name: "Komunitas Test",
      description: "Tenant fixture untuk spec resources",
      status: "active",
      ownerId,
    });
    await ctx.db.insert("memberships", { tenantId, userId: ownerId, role: "owner" });
    await ctx.db.insert("memberships", { tenantId, userId: instructorId, role: "instructor" });
    await ctx.db.insert("memberships", { tenantId, userId: memberId, role: "member" });
    await ctx.db.insert("memberships", { tenantId, userId: member2Id, role: "member" });
    return { tenantId, ownerId, instructorId, memberId, member2Id, outsiderId };
  });
}

/** Insert a resource directly (bypasses the mutation) for read/curate specs. */
export async function seedResource(
  t: T,
  fx: TenantFixture,
  status: "pending" | "approved" | "rejected",
  submittedBy: Id<"users">,
  title = `Resource ${status}`
): Promise<Id<"resources">> {
  return await t.run(async (ctx) =>
    ctx.db.insert("resources", {
      tenantId: fx.tenantId,
      title,
      url: "https://example.com/artikel",
      submittedBy,
      status,
    })
  );
}

/** Insert a suggestion directly for read/triage specs. */
export async function seedSuggestion(
  t: T,
  fx: TenantFixture,
  status: "open" | "planned" | "done" | "rejected",
  submittedBy: Id<"users">,
  title = `Usulan ${status}`
): Promise<Id<"suggestions">> {
  return await t.run(async (ctx) =>
    ctx.db.insert("suggestions", {
      tenantId: fx.tenantId,
      title,
      submittedBy,
      status,
    })
  );
}

/** Insert a vote row directly for count/read specs (#18). */
export async function seedVote(
  t: T,
  fx: TenantFixture,
  suggestionId: Id<"suggestions">,
  userId: Id<"users">
): Promise<Id<"suggestionVotes">> {
  return await t.run(async (ctx) =>
    ctx.db.insert("suggestionVotes", { tenantId: fx.tenantId, suggestionId, userId })
  );
}

/** Second ACTIVE tenant + one member of it — for cross-tenant rejection specs (#18). */
export async function seedOtherTenantMember(
  t: T
): Promise<{ otherTenantId: Id<"tenants">; otherMemberId: Id<"users"> }> {
  return await t.run(async (ctx) => {
    const otherMemberId = await ctx.db.insert("users", { email: "tetangga@test.id" });
    const otherTenantId = await ctx.db.insert("tenants", {
      slug: "komunitas-lain",
      name: "Komunitas Lain",
      description: "Tenant kedua untuk spec cross-tenant",
      status: "active",
      ownerId: otherMemberId,
    });
    await ctx.db.insert("memberships", {
      tenantId: otherTenantId,
      userId: otherMemberId,
      role: "member",
    });
    return { otherTenantId, otherMemberId };
  });
}
