/// <reference types="vite/client" />
// getPublicStatsBySlug — the TAB SIGNAL half (added 2026-08-11).
//
// Its own file rather than more rows in tenants.test.ts: this is a different
// contract with a different consumer (lib/community-tabs.ts decides what the
// navigation shows), and it is the half that fails SILENTLY — a wrong boolean
// does not throw, it just removes a tab from every page of a community.
//
// The query is ANONYMOUS by design (etalase whitelist, AGENTS.md §6), so the
// "denied path" here is not a rejected caller: it is a NON-ACTIVE tenant, which
// must answer null and hand out no signal at all.
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api } from "../../_generated/api";
import type { Id } from "../../_generated/dataModel";
import schema from "../../schema";

const modules = import.meta.glob([
  "/convex/**/*.{js,ts}",
  "!/convex/**/*.test.ts",
  "!/convex/**/*.d.ts",
]);

async function seedTenant(
  t: ReturnType<typeof convexTest>,
  status: "active" | "pending" = "active"
) {
  return t.run(async (ctx) => {
    const ownerId = await ctx.db.insert("users", { email: "owner@example.com" });
    const tenantId = await ctx.db.insert("tenants", {
      slug: "belajar-ai",
      name: "Belajar AI",
      description: "Komunitas belajar pengaplikasian AI.",
      track: "umum",
      status,
      ownerId,
    });
    await ctx.db.insert("memberships", { tenantId, userId: ownerId, role: "owner" });
    return { ownerId, tenantId };
  });
}

type LessonSeed = {
  title: string;
  status?: "draft" | "published";
  kind?: "materi" | "skill";
};

const addLesson = (
  t: ReturnType<typeof convexTest>,
  tenantId: Id<"tenants">,
  lesson: LessonSeed
) =>
  t.run(async (ctx) => {
    await ctx.db.insert("lessons", {
      tenantId,
      title: lesson.title,
      slug: lesson.title.toLowerCase().replace(/\s+/g, "-"),
      status: lesson.status,
      kind: lesson.kind,
      contentMd: "isi",
      links: [],
    });
  });

const addEvent = (
  t: ReturnType<typeof convexTest>,
  tenantId: Id<"tenants">,
  ownerId: Id<"users">,
  canceled: boolean
) =>
  t.run(async (ctx) => {
    await ctx.db.insert("events", {
      tenantId,
      title: "Sesi live",
      startsAt: Date.now() + 86_400_000,
      createdBy: ownerId,
      canceledAt: canceled ? Date.now() : undefined,
    });
  });

const stats = (t: ReturnType<typeof convexTest>) =>
  t.query(api.features.tenants.queries.getPublicStatsBySlug, { slug: "belajar-ai" });

describe("getPublicStatsBySlug — tab signal", () => {
  test("an empty community reports every optional tab as empty", async () => {
    const t = convexTest(schema, modules);
    await seedTenant(t);
    expect(await stats(t)).toMatchObject({
      hasMateri: false,
      hasSkills: false,
      hasEvents: false,
    });
  });

  test("a published materi lights hasMateri and nothing else", async () => {
    const t = convexTest(schema, modules);
    const { tenantId } = await seedTenant(t);
    await addLesson(t, tenantId, { title: "Dasar AI", status: "published" });
    expect(await stats(t)).toMatchObject({
      hasMateri: true,
      hasSkills: false,
      hasEvents: false,
    });
  });

  test("a PRE-STATUS materi counts — the column is optional and absent means published", async () => {
    // The 76 production rows that predate `status` are visible to readers, so a
    // signal that missed them would hide the Materi tab of the live community.
    const t = convexTest(schema, modules);
    const { tenantId } = await seedTenant(t);
    await addLesson(t, tenantId, { title: "Materi lama" }); // no status at all
    expect(await stats(t)).toMatchObject({ hasMateri: true });
  });

  test("a DRAFT alone does not light a tab — the signal is what anon can see", async () => {
    const t = convexTest(schema, modules);
    const { tenantId } = await seedTenant(t);
    await addLesson(t, tenantId, { title: "Belum jadi", status: "draft" });
    await addLesson(t, tenantId, { title: "Prompt draf", status: "draft", kind: "skill" });
    expect(await stats(t)).toMatchObject({ hasMateri: false, hasSkills: false });
  });

  test("a skills-only community lights hasSkills and NOT hasMateri", async () => {
    // This asserted the opposite, on a false premise: its comment claimed "the
    // Materi library lists skills too", but listLibrary filters kind and
    // EXCLUDES them. A skills-only tenant therefore got a Materi tab opening an
    // empty library — the exact "tabs are decoration" outcome this signal is
    // for. A tab must track the library it actually opens.
    const t = convexTest(schema, modules);
    const { tenantId } = await seedTenant(t);
    await addLesson(t, tenantId, {
      title: "Balas email",
      status: "published",
      kind: "skill",
    });
    expect(await stats(t)).toMatchObject({ hasMateri: false, hasSkills: true });

    await addLesson(t, tenantId, { title: "Materi biasa", status: "published" });
    expect(await stats(t)).toMatchObject({ hasMateri: true, hasSkills: true });
  });

  test("a canceled session does not count as a session", async () => {
    const t = convexTest(schema, modules);
    const { tenantId, ownerId } = await seedTenant(t);
    await addEvent(t, tenantId, ownerId, true);
    expect(await stats(t)).toMatchObject({ hasEvents: false });
    await addEvent(t, tenantId, ownerId, false);
    expect(await stats(t)).toMatchObject({ hasEvents: true });
  });

  test("the signal is scoped to the tenant — a sibling's content never leaks in", async () => {
    const t = convexTest(schema, modules);
    await seedTenant(t);
    await t.run(async (ctx) => {
      const otherOwner = await ctx.db.insert("users", { email: "other@example.com" });
      const other = await ctx.db.insert("tenants", {
        slug: "kreator-konten",
        name: "Kreator Konten",
        description: "Komunitas kreator konten Indonesia.",
        track: "umum",
        status: "active",
        ownerId: otherOwner,
      });
      await ctx.db.insert("lessons", {
        tenantId: other,
        title: "Ide konten",
        status: "published",
        kind: "skill",
        contentMd: "isi",
        links: [],
      });
      await ctx.db.insert("events", {
        tenantId: other,
        title: "Sesi",
        startsAt: Date.now() + 1000,
        createdBy: otherOwner,
      });
    });
    expect(await stats(t)).toMatchObject({
      hasMateri: false,
      hasSkills: false,
      hasEvents: false,
    });
  });

  test("a non-active tenant answers null — no signal, same as an unknown slug", async () => {
    const t = convexTest(schema, modules);
    const { tenantId } = await seedTenant(t, "pending");
    await addLesson(t, tenantId, { title: "Dasar AI", status: "published" });
    expect(await stats(t)).toBeNull();
    expect(
      await t.query(api.features.tenants.queries.getPublicStatsBySlug, { slug: "tidak-ada" })
    ).toBeNull();
  });

  test("still no user data, still no webhook — the signal added booleans only", async () => {
    const t = convexTest(schema, modules);
    const { tenantId } = await seedTenant(t);
    await addLesson(t, tenantId, { title: "Dasar AI", status: "published" });
    const result = await stats(t);
    expect(JSON.stringify(result)).not.toContain("webhook");
    expect(Object.keys(result ?? {}).sort()).toEqual([
      "courseCount",
      "hasEvents",
      "hasMateri",
      "hasSkills",
      "memberCount",
      "memberCountCapped",
    ]);
  });
});
