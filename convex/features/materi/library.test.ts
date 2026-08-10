/// <reference types="vite/client" />
// listLibrary / listTags — member-only, bounded, draft-aware.
import { expect, test } from "vitest";
import { api } from "../../_generated/api";
import { asUser, seedCourse, seedMateri, seedTenantFixture, setup } from "./test.helpers";

const PAGE = { numItems: 10, cursor: null };

test("listLibrary: anon NOT_AUTHENTICATED, outsider NOT_AUTHORIZED", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const args = { tenantId: fx.tenantId, paginationOpts: PAGE };

  await expect(t.query(api.features.materi.library.listLibrary, args)).rejects.toThrow(
    /NOT_AUTHENTICATED/
  );
  await expect(
    t.withIdentity(asUser(fx.outsiderId)).query(api.features.materi.library.listLibrary, args)
  ).rejects.toThrow(/NOT_AUTHORIZED/);
});

test("listLibrary: member sees published only; instructor+ also sees drafts", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const live = await seedMateri(t, fx, { slug: "hidup", title: "Hidup", status: "published" });
  await seedMateri(t, fx, { slug: "draf", title: "Draf", status: "draft" });
  await seedMateri(t, fx, { slug: "warisan", title: "Warisan", status: undefined });
  await seedCourse(t, fx, "published", [live], "claude-code");
  const args = { tenantId: fx.tenantId, paginationOpts: PAGE };

  const asMember = await t
    .withIdentity(asUser(fx.memberId))
    .query(api.features.materi.library.listLibrary, args);
  expect(asMember.page.map((row) => row.title).sort()).toEqual(["Hidup", "Warisan"]);
  expect(asMember.isDone).toBe(true);

  const asInstructor = await t
    .withIdentity(asUser(fx.instructorId))
    .query(api.features.materi.library.listLibrary, args);
  expect(asInstructor.page.map((row) => row.title).sort()).toEqual([
    "Draf",
    "Hidup",
    "Warisan",
  ]);
});

test("listLibrary: safe projection with tags + courseCount, never the body", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const lessonId = await seedMateri(t, fx, {
    slug: "sub-agents",
    status: "published",
    tags: ["agent"],
  });
  await seedCourse(t, fx, "published", [lessonId], "claude-code");
  await seedCourse(t, fx, "draft", [lessonId], "hermes");

  const result = await t
    .withIdentity(asUser(fx.memberId))
    .query(api.features.materi.library.listLibrary, {
      tenantId: fx.tenantId,
      paginationOpts: PAGE,
    });
  const card = result.page[0];
  expect(Object.keys(card).sort()).toEqual(
    ["_id", "courseCount", "kind", "promptPreview", "slug", "tags", "title", "updatedAt"].sort()
  );
  expect(card.tags).toEqual(["agent"]);
  expect(card.courseCount).toBe(2); // placements, not published courses
  expect(card.kind).toBe("materi"); // no kind column = materi
  expect(card.promptPreview).toBeNull();
});

test("listLibrary: tag filter narrows, normalises, and hides drafts", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  await seedMateri(t, fx, {
    slug: "a",
    title: "A",
    status: "published",
    tags: ["prompting"],
  });
  await seedMateri(t, fx, { slug: "b", title: "B", status: "published", tags: ["agent"] });
  await seedMateri(t, fx, { slug: "c", title: "C", status: "draft", tags: ["prompting"] });

  const call = (tag: string, user = fx.memberId) =>
    t.withIdentity(asUser(user)).query(api.features.materi.library.listLibrary, {
      tenantId: fx.tenantId,
      tag,
      paginationOpts: PAGE,
    });

  expect((await call("prompting")).page.map((r) => r.title)).toEqual(["A"]);
  // The filter is normalised the same way setTags normalises what it stores.
  expect((await call("  PROMPTING ")).page.map((r) => r.title)).toEqual(["A"]);
  expect((await call("prompting", fx.ownerId)).page.map((r) => r.title).sort()).toEqual([
    "A",
    "C",
  ]);
  // A filter that cannot be a tag matches nothing instead of scanning.
  const junk = await call("!!!");
  expect(junk.page).toEqual([]);
  expect(junk.isDone).toBe(true);
});

test("listLibrary: page size is clamped to the bound", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  for (let i = 0; i < 25; i++) {
    await seedMateri(t, fx, { slug: `m-${i}`, title: `Materi ${i}`, status: "published" });
  }
  const result = await t
    .withIdentity(asUser(fx.memberId))
    .query(api.features.materi.library.listLibrary, {
      tenantId: fx.tenantId,
      paginationOpts: { numItems: 500, cursor: null },
    });
  expect(result.page.length).toBe(20); // LIBRARY_PAGE_MAX
  expect(result.isDone).toBe(false);
});

// A skill is a materi with `kind: "skill"`, so the ONE query serves both
// libraries — and neither may bleed into the other.
test("listLibrary: skills stay out of the materi library and vice versa", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  await seedMateri(t, fx, { slug: "biasa", title: "Materi Biasa", status: "published" });
  await seedMateri(t, fx, { slug: "lawas", title: "Materi Lawas" }); // no status, no kind
  await seedMateri(t, fx, {
    slug: "review-kode",
    title: "Review Kode",
    status: "published",
    kind: "skill",
    promptText: "Kamu adalah reviewer kode. Jelaskan risikonya.",
  });
  const call = (kind?: "materi" | "skill") =>
    t.withIdentity(asUser(fx.memberId)).query(api.features.materi.library.listLibrary, {
      tenantId: fx.tenantId,
      ...(kind === undefined ? {} : { kind }),
      paginationOpts: PAGE,
    });

  // Absent kind = the materi library, exactly as before skills existed.
  expect((await call()).page.map((r) => r.title).sort()).toEqual([
    "Materi Biasa",
    "Materi Lawas",
  ]);
  expect((await call("materi")).page.map((r) => r.title).sort()).toEqual([
    "Materi Biasa",
    "Materi Lawas",
  ]);

  const skills = await call("skill");
  expect(skills.page.map((r) => r.title)).toEqual(["Review Kode"]);
  expect(skills.page[0].kind).toBe("skill");
  expect(skills.page[0].promptPreview).toBe("Kamu adalah reviewer kode. Jelaskan risikonya.");
});

test("listLibrary: a draft skill is instructor+ only, in the skill range too", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  await seedMateri(t, fx, { slug: "hidup", title: "Skill Hidup", status: "published", kind: "skill" });
  await seedMateri(t, fx, { slug: "draf", title: "Skill Draf", status: "draft", kind: "skill" });
  // A seeded skill with NO status column still reads as published.
  await seedMateri(t, fx, { slug: "lawas", title: "Skill Lawas", kind: "skill" });
  const call = (userId: typeof fx.memberId) =>
    t.withIdentity(asUser(userId)).query(api.features.materi.library.listLibrary, {
      tenantId: fx.tenantId,
      kind: "skill",
      paginationOpts: PAGE,
    });

  expect((await call(fx.memberId)).page.map((r) => r.title).sort()).toEqual([
    "Skill Hidup",
    "Skill Lawas",
  ]);
  expect((await call(fx.instructorId)).page.map((r) => r.title).sort()).toEqual([
    "Skill Draf",
    "Skill Hidup",
    "Skill Lawas",
  ]);
});

test("listLibrary: sort newest / oldest ride the index, title orders the page A→Z", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  for (const title of ["Charlie", "Alfa", "Bravo"]) {
    await seedMateri(t, fx, {
      slug: title.toLowerCase(),
      title,
      status: "published",
      kind: "skill",
    });
  }
  const call = (sort: "newest" | "oldest" | "title") =>
    t.withIdentity(asUser(fx.memberId)).query(api.features.materi.library.listLibrary, {
      tenantId: fx.tenantId,
      kind: "skill",
      sort,
      paginationOpts: PAGE,
    });

  expect((await call("newest")).page.map((r) => r.title)).toEqual(["Bravo", "Alfa", "Charlie"]);
  expect((await call("oldest")).page.map((r) => r.title)).toEqual(["Charlie", "Alfa", "Bravo"]);
  expect((await call("title")).page.map((r) => r.title)).toEqual(["Alfa", "Bravo", "Charlie"]);
});

test("listLibrary: the tag branch honours kind and sort too", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  await seedMateri(t, fx, {
    slug: "materi-agent",
    title: "Materi Agent",
    status: "published",
    tags: ["agent"],
  });
  await seedMateri(t, fx, {
    slug: "skill-agent",
    title: "Skill Agent",
    status: "published",
    kind: "skill",
    tags: ["agent"],
  });
  const call = (kind: "materi" | "skill") =>
    t.withIdentity(asUser(fx.memberId)).query(api.features.materi.library.listLibrary, {
      tenantId: fx.tenantId,
      kind,
      tag: "agent",
      sort: "title",
      paginationOpts: PAGE,
    });

  expect((await call("materi")).page.map((r) => r.title)).toEqual(["Materi Agent"]);
  expect((await call("skill")).page.map((r) => r.title)).toEqual(["Skill Agent"]);
});

test("listTags: counts per tag, member-only, one materi counts once", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  await seedMateri(t, fx, {
    slug: "a",
    title: "A",
    status: "published",
    tags: ["prompting", "agent"],
  });
  await seedMateri(t, fx, { slug: "b", title: "B", status: "published", tags: ["prompting"] });
  const other = await seedTenantFixture(t, "komunitas-lain");
  await seedMateri(t, other, { slug: "x", title: "X", status: "published", tags: ["agent"] });

  await expect(
    t.query(api.features.materi.library.listTags, { tenantId: fx.tenantId })
  ).rejects.toThrow(/NOT_AUTHENTICATED/);
  await expect(
    t
      .withIdentity(asUser(fx.outsiderId))
      .query(api.features.materi.library.listTags, { tenantId: fx.tenantId })
  ).rejects.toThrow(/NOT_AUTHORIZED/);

  const tags = await t
    .withIdentity(asUser(fx.memberId))
    .query(api.features.materi.library.listTags, { tenantId: fx.tenantId });
  // Sorted by count desc, then alphabetically. The other tenant's `agent` row
  // is outside the index range and never counted.
  expect(tags).toEqual([
    { tag: "prompting", count: 2 },
    { tag: "agent", count: 1 },
  ]);
});
