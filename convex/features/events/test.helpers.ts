/// <reference types="vite/client" />
// Self-contained fixture for the events convex-test specs (pattern:
// convex/features/quiz/test.helpers.ts). Roles: owner / instructor / member /
// outsider (no membership) — every spec exercises the authz-denied path with
// these (DoD §5.2, P0). Seeds shared tables via ctx.db directly; never imports
// another feature (AGENTS.md §4).
import { convexTest } from "convex-test";
import type { Id } from "../../_generated/dataModel";
import schema from "../../schema";

// Absolute glob rooted at /convex so convex-test resolves nested function
// paths consistently from this nested helper.
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

export const HOUR_MS = 60 * 60 * 1000;
export const DAY_MS = 24 * HOUR_MS;

export type TenantFixture = {
  tenantId: Id<"tenants">;
  ownerId: Id<"users">;
  instructorId: Id<"users">;
  memberId: Id<"users">;
  outsiderId: Id<"users">;
};

/** Tenant (active by default) + one user per role; outsider has NO membership. */
export async function seedTenantFixture(
  t: T,
  slug = "komunitas-test",
  status: "pending" | "active" | "suspended" = "active"
): Promise<TenantFixture> {
  return await t.run(async (ctx) => {
    const ownerId = await ctx.db.insert("users", { email: `owner-${slug}@test.id` });
    const instructorId = await ctx.db.insert("users", { email: `guru-${slug}@test.id` });
    const memberId = await ctx.db.insert("users", { email: `member-${slug}@test.id` });
    const outsiderId = await ctx.db.insert("users", { email: `luar-${slug}@test.id` });
    const tenantId = await ctx.db.insert("tenants", {
      slug,
      name: "Komunitas Test",
      description: "Tenant fixture untuk spec events",
      status,
      ownerId,
    });
    await ctx.db.insert("memberships", { tenantId, userId: ownerId, role: "owner" });
    await ctx.db.insert("memberships", { tenantId, userId: instructorId, role: "instructor" });
    await ctx.db.insert("memberships", { tenantId, userId: memberId, role: "member" });
    return { tenantId, ownerId, instructorId, memberId, outsiderId };
  });
}

export type SeedEventOverrides = {
  title?: string;
  description?: string;
  startsAt?: number;
  endsAt?: number;
  locationUrl?: string;
  canceledAt?: number;
};

/** Insert an event row directly (bypasses the mutation, for read specs). */
export async function seedEvent(
  t: T,
  fx: TenantFixture,
  overrides: SeedEventOverrides = {}
): Promise<Id<"events">> {
  return await t.run(async (ctx) =>
    ctx.db.insert("events", {
      tenantId: fx.tenantId,
      title: overrides.title ?? "Sesi live mingguan",
      description: overrides.description,
      startsAt: overrides.startsAt ?? Date.now() + DAY_MS,
      endsAt: overrides.endsAt,
      locationUrl: overrides.locationUrl,
      createdBy: fx.instructorId,
      canceledAt: overrides.canceledAt,
    })
  );
}

/** Valid `create` payload; startsAt is one day out unless overridden. */
export function validEventArgs(tenantId: Id<"tenants">, overrides: SeedEventOverrides = {}) {
  return {
    tenantId,
    title: overrides.title ?? "Sesi live: prompt dasar",
    description: overrides.description,
    startsAt: overrides.startsAt ?? Date.now() + DAY_MS,
    endsAt: overrides.endsAt,
    locationUrl: overrides.locationUrl,
  };
}
