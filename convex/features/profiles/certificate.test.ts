/// <reference types="vite/client" />
// convex-test coverage for publicGetCertificate (STATUS #24). Pattern:
// public.test.ts fixtures + the authz-order dangling-id precedent.
//
// The query is ANONYMOUS by design (AGENTS.md §6 etalase). Security assertions
// (the etalase analog of the authz-denied path, DoD §5.2):
//   (a) an anonymous caller SUCCEEDS for a valid certificate;
//   (b) the projection is EXACTLY the safe key set — zero ids;
//   (c) every invalid case (malformed id, unknown id, draft/archived course,
//       suspended/pending tenant, missing owner profile) throws the SAME
//       NOT_FOUND — no oracle distinguishing the cases.
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

type CertSeed = {
  username?: string;
  displayName?: string;
  withProfile?: boolean;
  tenantStatus?: "active" | "suspended" | "pending";
  courseStatus?: "draft" | "published" | "archived";
};

/** Seed user(+profile) + tenant + course + completion; returns the ids. */
async function seedCertificate(t: ReturnType<typeof makeT>, seed: CertSeed = {}) {
  const {
    username = "rahman-ef",
    displayName = "Rahman Ef",
    withProfile = true,
    tenantStatus = "active",
    courseStatus = "published",
  } = seed;
  return await t.run(async (ctx) => {
    const userId = await ctx.db.insert("users", { email: `${username}@test.id` });
    if (withProfile) {
      await ctx.db.insert("profiles", { userId, username, displayName });
    }
    const ownerId = await ctx.db.insert("users", { email: `owner-${username}@test.id` });
    const tenantId = await ctx.db.insert("tenants", {
      slug: `komunitas-${username}`,
      name: `Komunitas ${displayName}`,
      description: "fixture",
      status: tenantStatus,
      ownerId,
    });
    const courseId = await ctx.db.insert("courses", {
      tenantId,
      slug: "dasar-ai",
      title: "Dasar AI",
      description: "fixture",
      status: courseStatus,
      createdBy: ownerId,
    });
    const completionId = await ctx.db.insert("courseCompletions", {
      tenantId,
      userId,
      courseId,
    });
    return { userId, tenantId, courseId, completionId };
  });
}

async function expectNotFound(
  t: ReturnType<typeof makeT>,
  completionId: string
) {
  await expect(
    t.query(api.features.profiles.public.publicGetCertificate, { completionId })
  ).rejects.toBeInstanceOf(ConvexError);
  await expect(
    t.query(api.features.profiles.public.publicGetCertificate, { completionId })
  ).rejects.toThrow(/NOT_FOUND/);
}

describe("publicGetCertificate", () => {
  test("anonymous caller succeeds for a valid certificate (etalase, no auth)", async () => {
    const t = makeT();
    const { completionId } = await seedCertificate(t);

    // No withIdentity → anonymous. Must resolve (no NOT_AUTHENTICATED throw).
    const cert = await t.query(api.features.profiles.public.publicGetCertificate, {
      completionId,
    });

    expect(cert).toEqual({
      displayName: "Rahman Ef",
      username: "rahman-ef",
      courseTitle: "Dasar AI",
      tenantName: "Komunitas Rahman Ef",
      earnedAt: expect.any(Number),
    });
  });

  test("projection shape: keys are EXACTLY the safe set — zero ids (P0 §6)", async () => {
    const t = makeT();
    const { completionId } = await seedCertificate(t);

    const cert = await t.query(api.features.profiles.public.publicGetCertificate, {
      completionId,
    });

    expect(Object.keys(cert).sort()).toEqual([
      "courseTitle",
      "displayName",
      "earnedAt",
      "tenantName",
      "username",
    ]);
    // Belt-and-suspenders: internals are absent, not just unread.
    const leaky = cert as Record<string, unknown>;
    for (const key of ["_id", "_creationTime", "userId", "courseId", "tenantId", "completionId", "isPlatformAdmin"]) {
      expect(key in leaky).toBe(false);
    }
  });

  test("malformed id string → NOT_FOUND (normalizeId, no validator crash)", async () => {
    const t = makeT();
    await expectNotFound(t, "id-ngawur-bukan-convex");
    await expectNotFound(t, "");
  });

  test("dangling id (completion deleted) → NOT_FOUND", async () => {
    const t = makeT();
    const { completionId } = await seedCertificate(t);
    await t.run(async (ctx) => {
      await ctx.db.delete(completionId);
    });
    await expectNotFound(t, completionId);
  });

  test("foreign-table id → NOT_FOUND (normalizeId rejects, same error)", async () => {
    const t = makeT();
    const { courseId } = await seedCertificate(t);
    // A valid Convex id, but for the wrong table — must be indistinguishable.
    await expectNotFound(t, courseId as string as Id<"courseCompletions">);
  });

  test("draft course → NOT_FOUND (never leak drafts, P0 §6)", async () => {
    const t = makeT();
    const { completionId } = await seedCertificate(t, {
      username: "penulis",
      courseStatus: "draft",
    });
    await expectNotFound(t, completionId);
  });

  test("archived course → NOT_FOUND (published-only, matches badge wall)", async () => {
    const t = makeT();
    const { completionId } = await seedCertificate(t, {
      username: "veteran",
      courseStatus: "archived",
    });
    await expectNotFound(t, completionId);
  });

  test("suspended/pending tenant → NOT_FOUND (inactive stays private)", async () => {
    const t = makeT();
    const a = await seedCertificate(t, { username: "member-a", tenantStatus: "suspended" });
    const b = await seedCertificate(t, { username: "member-b", tenantStatus: "pending" });
    await expectNotFound(t, a.completionId);
    await expectNotFound(t, b.completionId);
  });

  test("owner without a profile → NOT_FOUND (certificate needs a public identity)", async () => {
    const t = makeT();
    const { completionId } = await seedCertificate(t, {
      username: "tanpa-profil",
      withProfile: false,
    });
    await expectNotFound(t, completionId);
  });
});

describe("publicListBadges — completionId as certificate handle (STATUS #24)", () => {
  test("each badge carries the completionId that publicGetCertificate resolves", async () => {
    const t = makeT();
    const { userId, completionId } = await seedCertificate(t);

    const badges = await t.query(api.features.profiles.public.publicListBadges, {
      username: "rahman-ef",
    });
    expect(badges).toHaveLength(1);
    expect(badges[0].completionId).toBe(completionId);

    // Round-trip: the badge's handle opens the certificate for the same user.
    const cert = await t.query(api.features.profiles.public.publicGetCertificate, {
      completionId: badges[0].completionId,
    });
    expect(cert.username).toBe("rahman-ef");
    // userId itself never appears anywhere in either projection.
    expect(JSON.stringify(badges).includes(userId)).toBe(false);
    expect(JSON.stringify(cert).includes(userId)).toBe(false);
  });
});
