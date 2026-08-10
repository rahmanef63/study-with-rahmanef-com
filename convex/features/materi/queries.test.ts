/// <reference types="vite/client" />
// The materi visibility contract (access.ts), asserted clause by clause:
// anonymous gets the etalase and never the body; a member sees published
// materi; instructor+ additionally sees drafts; a COURSE's draft status hides
// the course from the "muncul di" list but NEVER hides the materi itself.
import { expect, test } from "vitest";
import { api } from "../../_generated/api";
import {
  asUser,
  seedCourse,
  seedMateri,
  seedRef,
  seedTenantFixture,
  setup,
} from "./test.helpers";

test("publicGetBySlug: anonymous gets title/tags/courses and NEVER the body", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const lessonId = await seedMateri(t, fx, {
    slug: "sub-agents",
    title: "Sub Agents",
    status: "published",
    withVideo: true,
    tags: ["claude-code", "agent"],
  });
  await seedCourse(t, fx, "published", [lessonId], "claude-code");
  await seedCourse(t, fx, "draft", [lessonId], "hermes");

  const materi = await t.query(api.features.materi.queries.publicGetBySlug, {
    tenantSlug: fx.tenantSlug,
    lessonSlug: "sub-agents",
  });
  expect(materi).not.toBeNull();
  expect(materi!.title).toBe("Sub Agents");
  expect(materi!.tags).toEqual(["agent", "claude-code"]);
  expect(materi!.hasVideo).toBe(true);
  expect(materi!.tenant.slug).toBe(fx.tenantSlug);
  // Only the PUBLISHED course is named to an anonymous caller.
  expect(materi!.courses).toEqual([{ slug: "claude-code", title: "Kelas published" }]);
  // The body, in every form it could leak.
  expect(materi).not.toHaveProperty("contentMd");
  expect(materi).not.toHaveProperty("contentBlocks");
  expect(materi).not.toHaveProperty("links");
  expect(materi).not.toHaveProperty("youtubeVideoId");
  expect(materi).not.toHaveProperty("authorId");
  expect(Object.keys(materi!).sort()).toEqual(
    ["_id", "courses", "createdAt", "hasVideo", "slug", "tags", "tenant", "title"].sort()
  );
});

test("publicGetBySlug: draft, unknown and malformed slugs are all null; dead tenant NOT_FOUND", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  await seedMateri(t, fx, { slug: "rahasia", status: "draft" });

  const call = (lessonSlug: string) =>
    t.query(api.features.materi.queries.publicGetBySlug, {
      tenantSlug: fx.tenantSlug,
      lessonSlug,
    });
  expect(await call("rahasia")).toBeNull(); // draft — indistinguishable from absent
  expect(await call("tidak-ada")).toBeNull();
  expect(await call("BUKAN SLUG!!")).toBeNull();
  // Even an instructor gets nothing from the anonymous surface: it is the
  // etalase projection, not a role-aware read.
  expect(
    await t
      .withIdentity(asUser(fx.instructorId))
      .query(api.features.materi.queries.publicGetBySlug, {
        tenantSlug: fx.tenantSlug,
        lessonSlug: "rahasia",
      })
  ).toBeNull();

  await t.run(async (ctx) => ctx.db.patch(fx.tenantId, { status: "suspended" }));
  await expect(call("rahasia")).rejects.toThrow(/NOT_FOUND/);
});

test("getBySlug: anon NOT_AUTHENTICATED, outsider NOT_AUTHORIZED, member gets content", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const lessonId = await seedMateri(t, fx, { slug: "sub-agents", status: "published" });
  await seedCourse(t, fx, "published", [lessonId], "claude-code");
  const args = { tenantSlug: fx.tenantSlug, lessonSlug: "sub-agents" };

  await expect(t.query(api.features.materi.queries.getBySlug, args)).rejects.toThrow(
    /NOT_AUTHENTICATED/
  );
  await expect(
    t.withIdentity(asUser(fx.outsiderId)).query(api.features.materi.queries.getBySlug, args)
  ).rejects.toThrow(/NOT_AUTHORIZED/);

  const detail = await t
    .withIdentity(asUser(fx.memberId))
    .query(api.features.materi.queries.getBySlug, args);
  expect(detail.contentMd).toContain("rahasia member");
  expect(detail.viewerRole).toBe("member");
  expect(detail.canEdit).toBe(false);
  expect(detail.courses.map((c) => c.slug)).toEqual(["claude-code"]);
});

test("getBySlug: draft materi is NOT_FOUND for a member, readable by instructor+", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  await seedMateri(t, fx, { slug: "draf", status: "draft" });
  const args = { tenantSlug: fx.tenantSlug, lessonSlug: "draf" };

  await expect(
    t.withIdentity(asUser(fx.memberId)).query(api.features.materi.queries.getBySlug, args)
  ).rejects.toThrow(/NOT_FOUND/);
  const asInstructor = await t
    .withIdentity(asUser(fx.instructorId))
    .query(api.features.materi.queries.getBySlug, args);
  expect(asInstructor.status).toBe("draft");
  expect(asInstructor.canEdit).toBe(true);
});

test("a materi with NO status column counts as published (pre-migration row)", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  await seedMateri(t, fx, { slug: "warisan", status: undefined });

  const anon = await t.query(api.features.materi.queries.publicGetBySlug, {
    tenantSlug: fx.tenantSlug,
    lessonSlug: "warisan",
  });
  expect(anon).not.toBeNull();
  const member = await t
    .withIdentity(asUser(fx.memberId))
    .query(api.features.materi.queries.getBySlug, {
      tenantSlug: fx.tenantSlug,
      lessonSlug: "warisan",
    });
  expect(member.status).toBe("published");
});

test("a DRAFT COURSE hides the course, not the materi it teaches", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const lessonId = await seedMateri(t, fx, { slug: "sub-agents", status: "published" });
  await seedCourse(t, fx, "draft", [lessonId], "hermes");

  // Clause 3: the materi is fully readable by a plain member…
  const detail = await t
    .withIdentity(asUser(fx.memberId))
    .query(api.features.materi.queries.getBySlug, {
      tenantSlug: fx.tenantSlug,
      lessonSlug: "sub-agents",
    });
  expect(detail.contentMd).toContain("rahasia member");
  // …while the unpublished course is not named to them, but is to instructor+.
  expect(detail.courses).toEqual([]);
  const asInstructor = await t
    .withIdentity(asUser(fx.instructorId))
    .query(api.features.materi.queries.getBySlug, {
      tenantSlug: fx.tenantSlug,
      lessonSlug: "sub-agents",
    });
  expect(asInstructor.courses.map((c) => c.slug)).toEqual(["hermes"]);
});

test("backlinksFor: referencing materi + teaching courses, draft sources hidden", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const target = await seedMateri(t, fx, { slug: "sub-agents", status: "published" });
  const fromPublished = await seedMateri(t, fx, {
    slug: "hermes-intro",
    title: "Hermes Intro",
    status: "published",
  });
  const fromDraft = await seedMateri(t, fx, {
    slug: "catatan-draf",
    title: "Catatan Draf",
    status: "draft",
  });
  await seedRef(t, fx, fromPublished, target);
  await seedRef(t, fx, fromDraft, target);
  await seedCourse(t, fx, "published", [target], "claude-code");

  await expect(
    t.query(api.features.materi.queries.backlinksFor, { lessonId: target })
  ).rejects.toThrow(/NOT_AUTHENTICATED/);
  await expect(
    t
      .withIdentity(asUser(fx.outsiderId))
      .query(api.features.materi.queries.backlinksFor, { lessonId: target })
  ).rejects.toThrow(/NOT_AUTHORIZED/);

  const asMember = await t
    .withIdentity(asUser(fx.memberId))
    .query(api.features.materi.queries.backlinksFor, { lessonId: target });
  expect(asMember.materi.map((m) => m.title)).toEqual(["Hermes Intro"]);
  expect(asMember.courses.map((c) => c.slug)).toEqual(["claude-code"]);

  const asOwner = await t
    .withIdentity(asUser(fx.ownerId))
    .query(api.features.materi.queries.backlinksFor, { lessonId: target });
  expect(asOwner.materi.map((m) => m.title)).toEqual(["Catatan Draf", "Hermes Intro"]);
});

test("cross-tenant materi never leak into a backlink list", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const other = await seedTenantFixture(t, "komunitas-lain");
  const target = await seedMateri(t, fx, { slug: "sub-agents", status: "published" });
  const foreign = await seedMateri(t, other, {
    slug: "asing",
    title: "Materi Asing",
    status: "published",
  });
  await seedRef(t, fx, foreign, target); // a row that should never have existed

  const backlinks = await t
    .withIdentity(asUser(fx.ownerId))
    .query(api.features.materi.queries.backlinksFor, { lessonId: target });
  expect(backlinks.materi).toEqual([]);
});

test("getSlug: member resolves an in-course lesson id to its canonical slug", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const lessonId = await seedMateri(t, fx, { slug: "sub-agents", status: "published" });

  await expect(
    t.query(api.features.materi.queries.getSlug, { lessonId })
  ).rejects.toThrow(/NOT_AUTHENTICATED/);
  const resolved = await t
    .withIdentity(asUser(fx.memberId))
    .query(api.features.materi.queries.getSlug, { lessonId });
  expect(resolved.slug).toBe("sub-agents");
});

// The sitemap's only source. It is anonymous, so it must leak nothing beyond a
// URL — and it must not advertise a draft, which would send a crawler to a page
// that gates it.
test("publicListSlugs: published slugs only, drafts and suspended tenants excluded", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  await seedMateri(t, fx, { title: "Sub Agents", slug: "sub-agents", status: "published" });
  await seedMateri(t, fx, { title: "Rahasia", slug: "rahasia", status: "draft" });
  // No status column at all — the pre-migration shape, which the contract
  // counts as published. A single "published" index range would drop it.
  await seedMateri(t, fx, { title: "Lawas", slug: "lawas" });

  const listed = await t.query(api.features.materi.queries.publicListSlugs, {
    tenantId: fx.tenantId,
  });
  expect(listed.map((row) => row.slug).sort()).toEqual(["lawas", "sub-agents"]);
  expect(Object.keys(listed[0]).sort()).toEqual(["slug", "updatedAt"]);

  await t.run(async (ctx) => {
    await ctx.db.patch(fx.tenantId, { status: "suspended" });
  });
  expect(
    await t.query(api.features.materi.queries.publicListSlugs, { tenantId: fx.tenantId })
  ).toEqual([]);
});
