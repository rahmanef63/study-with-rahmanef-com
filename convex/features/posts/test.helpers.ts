/// <reference types="vite/client" />
// Shared fixture for posts convex-test specs (pattern:
// convex/features/comments/test.helpers.ts — duplicated per feature because
// convex features have no barrel and convex/_shared is integrator-only).
// Roles covered: owner / instructor / member / outsider (no membership) —
// every spec exercises the authz-denied path with these (DoD §5.2, P0).
import { convexTest } from "convex-test";
import type { Doc, Id } from "../../_generated/dataModel";
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
  outsiderId: Id<"users">;
};

/** Tenant (active by default) + one user per role (outsider has NO membership). */
export async function seedTenantFixture(
  t: T,
  slug = "komunitas-test",
  status: "pending" | "active" | "suspended" = "active"
): Promise<TenantFixture> {
  return await t.run(async (ctx) => {
    const ownerId = await ctx.db.insert("users", { email: `owner@${slug}.id` });
    const instructorId = await ctx.db.insert("users", { email: `guru@${slug}.id` });
    const memberId = await ctx.db.insert("users", { email: `member@${slug}.id` });
    const outsiderId = await ctx.db.insert("users", { email: `luar@${slug}.id` });
    const tenantId = await ctx.db.insert("tenants", {
      slug,
      name: "Komunitas Test",
      description: "Tenant fixture untuk spec posts",
      status,
      ownerId,
    });
    await ctx.db.insert("memberships", { tenantId, userId: ownerId, role: "owner" });
    await ctx.db.insert("memberships", { tenantId, userId: instructorId, role: "instructor" });
    await ctx.db.insert("memberships", { tenantId, userId: memberId, role: "member" });
    return { tenantId, ownerId, instructorId, memberId, outsiderId };
  });
}

export type SeedPostOverrides = Partial<
  Pick<
    Doc<"posts">,
    | "kind"
    | "title"
    | "bodyMd"
    | "linkUrl"
    | "youtubeVideoId"
    | "pinned"
    | "lastActivityAt"
    | "likeCount"
    | "commentCount"
    | "deletedAt"
  >
>;

/** Direct-insert a post row (bypasses the mutation — fixture only). */
export async function seedPost(
  t: T,
  fx: TenantFixture,
  authorId: Id<"users">,
  overrides: SeedPostOverrides = {}
): Promise<Id<"posts">> {
  return await t.run(async (ctx) =>
    ctx.db.insert("posts", {
      tenantId: fx.tenantId,
      authorId,
      kind: overrides.kind ?? "diskusi",
      title: overrides.title ?? "Judul fixture",
      bodyMd: overrides.bodyMd ?? "Isi post fixture.",
      linkUrl: overrides.linkUrl,
      youtubeVideoId: overrides.youtubeVideoId,
      pinned: overrides.pinned ?? false,
      lastActivityAt: overrides.lastActivityAt ?? Date.now(),
      likeCount: overrides.likeCount ?? 0,
      commentCount: overrides.commentCount ?? 0,
      deletedAt: overrides.deletedAt,
    })
  );
}

/** Profile row so the author join resolves public-profile fields. */
export async function seedProfile(
  t: T,
  userId: Id<"users">,
  username: string,
  displayName: string,
  avatarUrl?: string
): Promise<void> {
  await t.run(async (ctx) => {
    await ctx.db.insert("profiles", { userId, username, displayName, avatarUrl });
  });
}

/**
 * Read a membership's score back. `null` = the field was never written (every
 * pre-existing row is like this — the code must read it as 0), a number = a
 * like mutation touched it.
 */
export async function readPoints(
  t: T,
  tenantId: Id<"tenants">,
  userId: Id<"users">
): Promise<number | null> {
  return await t.run(async (ctx) => {
    const membership = await ctx.db
      .query("memberships")
      .withIndex("by_tenant_user", (q) => q.eq("tenantId", tenantId).eq("userId", userId))
      .unique();
    return membership?.points ?? null;
  });
}

/** First page request for publicListFeed. */
export const FIRST_PAGE = { numItems: 10, cursor: null };
