/// <reference types="vite/client" />
// convex-test coverage for the PUBLIC etalase surface (STATUS #9). Pattern:
// convex/features/profiles/profiles.test.ts + progress test.helpers seeding of
// shared tables via ctx.db.
//
// These two queries are ANONYMOUS by design (AGENTS.md §6 etalase). The
// security assertions here are the etalase analog of the authz-denied path
// (DoD §5.2): (a) an anonymous caller SUCCEEDS (no requireUser), and (b) the
// returned shape leaks NOTHING beyond the safe projection — no userId, no
// isPlatformAdmin. Mutations stay out: this file only touches `public*` reads.
import { convexTest } from "convex-test";
import { ConvexError } from "convex/values";
import { describe, expect, test } from "vitest";
import { api } from "../../_generated/api";
import type { Id } from "../../_generated/dataModel";
import schema from "../../schema";

const modules = import.meta.glob([
  "/convex/**/*.{js,ts}",
  "!/convex/**/*.test.ts",
  "!/convex/**/*.d.ts",
]);

function makeT() {
  return convexTest(schema, modules);
}

type ProfileSeed = {
  username: string;
  displayName: string;
  bio?: string;
  avatarUrl?: string;
  isPlatformAdmin?: boolean;
};

async function seedProfile(t: ReturnType<typeof makeT>, seed: ProfileSeed) {
  return await t.run(async (ctx) => {
    const userId = await ctx.db.insert("users", { email: `${seed.username}@test.id` });
    await ctx.db.insert("profiles", {
      userId,
      username: seed.username,
      displayName: seed.displayName,
      ...(seed.bio !== undefined ? { bio: seed.bio } : {}),
      ...(seed.avatarUrl !== undefined ? { avatarUrl: seed.avatarUrl } : {}),
      ...(seed.isPlatformAdmin ? { isPlatformAdmin: true } : {}),
    });
    return userId;
  });
}

/** Seed a tenant + course + a completion linking `userId` to it. */
async function seedCompletion(
  t: ReturnType<typeof makeT>,
  userId: Id<"users">,
  opts: {
    tenantSlug: string;
    tenantStatus: "active" | "suspended" | "pending";
    courseSlug: string;
    courseTitle: string;
    courseStatus: "draft" | "published" | "archived";
  }
) {
  return await t.run(async (ctx) => {
    const ownerId = await ctx.db.insert("users", { email: `owner-${opts.tenantSlug}@test.id` });
    const tenantId = await ctx.db.insert("tenants", {
      slug: opts.tenantSlug,
      name: `Komunitas ${opts.tenantSlug}`,
      description: "fixture",
      status: opts.tenantStatus,
      ownerId,
    });
    const courseId = await ctx.db.insert("courses", {
      tenantId,
      slug: opts.courseSlug,
      title: opts.courseTitle,
      description: "fixture",
      status: opts.courseStatus,
      createdBy: ownerId,
    });
    await ctx.db.insert("courseCompletions", { tenantId, userId, courseId });
    return { tenantId, courseId };
  });
}

describe("publicGetByUsername", () => {
  test("anonymous caller succeeds and gets the safe projection (etalase, no auth)", async () => {
    const t = makeT();
    await seedProfile(t, {
      username: "rahman-ef",
      displayName: "Rahman Ef",
      bio: "Belajar AI bareng",
      avatarUrl: "https://cdn.test/a.png",
      isPlatformAdmin: true, // must NOT leak
    });

    // No withIdentity → anonymous. Must resolve (no NOT_AUTHENTICATED throw).
    const result = await t.query(api.features.profiles.public.publicGetByUsername, {
      username: "rahman-ef",
    });

    expect(result).toEqual({
      username: "rahman-ef",
      displayName: "Rahman Ef",
      bio: "Belajar AI bareng",
      avatarUrl: "https://cdn.test/a.png",
    });
  });

  test("projection shape: keys are EXACTLY the safe set — no userId/isPlatformAdmin (P0)", async () => {
    const t = makeT();
    await seedProfile(t, {
      username: "admin-user",
      displayName: "Admin",
      bio: "hai",
      avatarUrl: "https://cdn.test/x.png",
      isPlatformAdmin: true,
    });

    const result = await t.query(api.features.profiles.public.publicGetByUsername, {
      username: "admin-user",
    });

    expect(Object.keys(result).sort()).toEqual([
      "avatarUrl",
      "bio",
      "displayName",
      "username",
    ]);
    // Belt-and-suspenders: internals/sensitive fields are absent, not just unread.
    const leaky = result as Record<string, unknown>;
    expect("userId" in leaky).toBe(false);
    expect("isPlatformAdmin" in leaky).toBe(false);
    expect("_id" in leaky).toBe(false);
    expect("_creationTime" in leaky).toBe(false);
  });

  test("absent optionals are null (stable key set), and lookup normalizes the handle", async () => {
    const t = makeT();
    await seedProfile(t, { username: "budi-san", displayName: "Budi" });

    // "BUDI SAN" normalizes to the canonical "budi-san" before lookup.
    const result = await t.query(api.features.profiles.public.publicGetByUsername, {
      username: "BUDI SAN",
    });

    expect(result).toEqual({
      username: "budi-san",
      displayName: "Budi",
      bio: null,
      avatarUrl: null,
    });
    expect(Object.keys(result).sort()).toEqual([
      "avatarUrl",
      "bio",
      "displayName",
      "username",
    ]);
  });

  test("unknown username → NOT_FOUND", async () => {
    const t = makeT();
    await expect(
      t.query(api.features.profiles.public.publicGetByUsername, { username: "tidak-ada" })
    ).rejects.toBeInstanceOf(ConvexError);
    await expect(
      t.query(api.features.profiles.public.publicGetByUsername, { username: "tidak-ada" })
    ).rejects.toThrow(/NOT_FOUND/);
  });
});

describe("publicListBadges", () => {
  test("joins completions → published courses of active tenants, newest first", async () => {
    const t = makeT();
    const userId = await seedProfile(t, { username: "rahman-ef", displayName: "Rahman Ef" });

    await seedCompletion(t, userId, {
      tenantSlug: "belajar-ai",
      tenantStatus: "active",
      courseSlug: "dasar-ai",
      courseTitle: "Dasar AI",
      courseStatus: "published",
    });
    // Inserted second → later _creationTime → should sort FIRST (newest).
    await seedCompletion(t, userId, {
      tenantSlug: "belajar-data",
      tenantStatus: "active",
      courseSlug: "sql-dasar",
      courseTitle: "SQL Dasar",
      courseStatus: "published",
    });

    const badges = await t.query(api.features.profiles.public.publicListBadges, {
      username: "rahman-ef",
    });

    expect(badges).toHaveLength(2);
    expect(badges[0]).toMatchObject({
      courseTitle: "SQL Dasar",
      courseSlug: "sql-dasar",
      tenantSlug: "belajar-data",
    });
    expect(badges[1]).toMatchObject({
      courseTitle: "Dasar AI",
      courseSlug: "dasar-ai",
      tenantSlug: "belajar-ai",
    });
    expect(typeof badges[0].earnedAt).toBe("number");
    expect(badges[0].earnedAt).toBeGreaterThanOrEqual(badges[1].earnedAt);
    // Exact key set — no ids / tenantId / userId leak.
    expect(Object.keys(badges[0]).sort()).toEqual([
      "courseSlug",
      "courseTitle",
      "earnedAt",
      "tenantSlug",
    ]);
  });

  test("draft courses are excluded (P0 §6: never leak drafts)", async () => {
    const t = makeT();
    const userId = await seedProfile(t, { username: "penulis", displayName: "Penulis" });
    await seedCompletion(t, userId, {
      tenantSlug: "komunitas-draft",
      tenantStatus: "active",
      courseSlug: "rahasia",
      courseTitle: "Kelas Rahasia",
      courseStatus: "draft",
    });

    const badges = await t.query(api.features.profiles.public.publicListBadges, {
      username: "penulis",
    });
    expect(badges).toEqual([]);
  });

  test("archived courses are excluded (published-only)", async () => {
    const t = makeT();
    const userId = await seedProfile(t, { username: "veteran", displayName: "Veteran" });
    await seedCompletion(t, userId, {
      tenantSlug: "komunitas-arsip",
      tenantStatus: "active",
      courseSlug: "lawas",
      courseTitle: "Kelas Lawas",
      courseStatus: "archived",
    });

    const badges = await t.query(api.features.profiles.public.publicListBadges, {
      username: "veteran",
    });
    expect(badges).toEqual([]);
  });

  test("completions in suspended/pending tenants stay private", async () => {
    const t = makeT();
    const userId = await seedProfile(t, { username: "member-x", displayName: "Member X" });
    await seedCompletion(t, userId, {
      tenantSlug: "komunitas-suspend",
      tenantStatus: "suspended",
      courseSlug: "kelas-a",
      courseTitle: "Kelas A",
      courseStatus: "published",
    });
    await seedCompletion(t, userId, {
      tenantSlug: "komunitas-pending",
      tenantStatus: "pending",
      courseSlug: "kelas-b",
      courseTitle: "Kelas B",
      courseStatus: "published",
    });

    const badges = await t.query(api.features.profiles.public.publicListBadges, {
      username: "member-x",
    });
    expect(badges).toEqual([]);
  });

  test("a profile with no completions returns an empty wall", async () => {
    const t = makeT();
    await seedProfile(t, { username: "baru", displayName: "Baru" });
    const badges = await t.query(api.features.profiles.public.publicListBadges, {
      username: "baru",
    });
    expect(badges).toEqual([]);
  });

  test("unknown username → NOT_FOUND", async () => {
    const t = makeT();
    await expect(
      t.query(api.features.profiles.public.publicListBadges, { username: "tidak-ada" })
    ).rejects.toThrow(/NOT_FOUND/);
  });
});
