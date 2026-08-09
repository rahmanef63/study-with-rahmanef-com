/// <reference types="vite/client" />
// Self-contained fixture for the leaderboard convex-test specs (pattern:
// convex/features/quiz/test.helpers.ts). Seeds shared tables via ctx.db
// directly and never imports another feature (AGENTS.md §4).
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

export type TenantFixture = {
  tenantId: Id<"tenants">;
  ownerId: Id<"users">;
  outsiderId: Id<"users">;
};

/** Tenant (active by default) + an owner membership + a non-member outsider. */
export async function seedTenantFixture(
  t: T,
  slug = "komunitas-test",
  status: "pending" | "active" | "suspended" = "active"
): Promise<TenantFixture> {
  return await t.run(async (ctx) => {
    const ownerId = await ctx.db.insert("users", { email: `owner-${slug}@test.id` });
    const outsiderId = await ctx.db.insert("users", { email: `luar-${slug}@test.id` });
    const tenantId = await ctx.db.insert("tenants", {
      slug,
      name: "Komunitas Test",
      description: "Tenant fixture untuk spec leaderboard",
      status,
      ownerId,
    });
    await ctx.db.insert("memberships", { tenantId, userId: ownerId, role: "owner" });
    return { tenantId, ownerId, outsiderId };
  });
}

export type SeedMemberOptions = {
  /** Omit to leave memberships.points UNSET — the pre-#30 shape. */
  points?: number;
  /** Set false to seed a member with no profile row. */
  withProfile?: boolean;
  role?: "owner" | "instructor" | "member";
};

/**
 * A member of `fx` with `points` (or none) and, by default, a public profile.
 * `username` doubles as the seed for displayName/email so specs stay readable.
 */
export async function seedMember(
  t: T,
  fx: TenantFixture,
  username: string,
  options: SeedMemberOptions = {}
): Promise<Id<"users">> {
  return await t.run(async (ctx) => {
    const userId = await ctx.db.insert("users", { email: `${username}@test.id` });
    await ctx.db.insert("memberships", {
      tenantId: fx.tenantId,
      userId,
      role: options.role ?? "member",
      points: options.points,
    });
    if (options.withProfile !== false) {
      await ctx.db.insert("profiles", {
        userId,
        username,
        displayName: `Nama ${username}`,
        avatarUrl: `https://cdn.test.id/${username}.png`,
        bio: "Bio rahasia yang tidak boleh bocor ke papan peringkat",
      });
    }
    return userId;
  });
}
