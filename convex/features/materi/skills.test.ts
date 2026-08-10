/// <reference types="vite/client" />
// searchSkills / getPrompt — member-only, bounded, draft-aware, and the one
// thing the schema's search index cannot do: match a skill by its PROMPT.
import { expect, test } from "vitest";
import { api } from "../../_generated/api";
import { asUser, seedMateri, seedTenantFixture, setup } from "./test.helpers";

const PROMPT =
  "Kamu adalah reviewer kode. Baca diff, lalu jelaskan langkah demi langkah risiko keamanannya.";

async function seedSkills(t: ReturnType<typeof setup>) {
  const fx = await seedTenantFixture(t);
  await seedMateri(t, fx, {
    slug: "review-kode",
    title: "Review Kode",
    status: "published",
    kind: "skill",
    promptText: PROMPT,
    tags: ["coding"],
  });
  await seedMateri(t, fx, {
    slug: "ringkas-rapat",
    title: "Ringkas Rapat",
    status: "published",
    kind: "skill",
    promptText: "Ringkas notulen rapat menjadi lima poin keputusan.",
    tags: ["produktivitas"],
  });
  // A plain materi whose BODY mentions the same words — it must never surface
  // in a skills search, whatever it says.
  await seedMateri(t, fx, { slug: "materi-biasa", title: "Review Kode Manual", status: "published" });
  return fx;
}

test("searchSkills: anon NOT_AUTHENTICATED, outsider NOT_AUTHORIZED", async () => {
  const t = setup();
  const fx = await seedSkills(t);
  const args = { tenantId: fx.tenantId, q: "review" };

  await expect(t.query(api.features.materi.skills.searchSkills, args)).rejects.toThrow(
    /NOT_AUTHENTICATED/
  );
  await expect(
    t.withIdentity(asUser(fx.outsiderId)).query(api.features.materi.skills.searchSkills, args)
  ).rejects.toThrow(/NOT_AUTHORIZED/);
});

test("searchSkills: matches the TITLE and the PROMPT, never a plain materi", async () => {
  const t = setup();
  const fx = await seedSkills(t);
  const call = (q: string) =>
    t
      .withIdentity(asUser(fx.memberId))
      .query(api.features.materi.skills.searchSkills, { tenantId: fx.tenantId, q });

  // By title.
  expect((await call("ringkas")).map((c) => c.title)).toEqual(["Ringkas Rapat"]);
  // By prompt text — the whole reason this query exists. "keamanan" appears
  // nowhere but inside promptText.
  expect((await call("keamanan")).map((c) => c.title)).toEqual(["Review Kode"]);
  // A phrase, not a token: substring matching is what a prompt search needs.
  expect((await call("langkah demi langkah")).map((c) => c.title)).toEqual(["Review Kode"]);
  // The plain materi titled "Review Kode Manual" is the wrong kind and is out.
  expect((await call("review")).map((c) => c.title)).toEqual(["Review Kode"]);
  expect(await call("tidak-ada-kata-ini")).toEqual([]);
});

test("searchSkills: query length is validated, not scanned", async () => {
  const t = setup();
  const fx = await seedSkills(t);
  const call = (q: string) =>
    t
      .withIdentity(asUser(fx.memberId))
      .query(api.features.materi.skills.searchSkills, { tenantId: fx.tenantId, q });

  await expect(call("a")).rejects.toThrow(/VALIDATION_FAILED/);
  await expect(call("x".repeat(61))).rejects.toThrow(/VALIDATION_FAILED/);
});

test("searchSkills: draft skills are instructor+ only", async () => {
  const t = setup();
  const fx = await seedSkills(t);
  await seedMateri(t, fx, {
    slug: "rahasia",
    title: "Skill Rahasia",
    status: "draft",
    kind: "skill",
    promptText: "Prompt yang belum siap dipublikasikan.",
  });
  const call = (userId: typeof fx.memberId) =>
    t
      .withIdentity(asUser(userId))
      .query(api.features.materi.skills.searchSkills, { tenantId: fx.tenantId, q: "rahasia" });

  expect(await call(fx.memberId)).toEqual([]);
  expect((await call(fx.instructorId)).map((c) => c.title)).toEqual(["Skill Rahasia"]);
});

test("searchSkills: tag narrows the scan, junk tag matches nothing, sort orders A→Z", async () => {
  const t = setup();
  const fx = await seedSkills(t);
  const call = (q: string, extra: Record<string, unknown> = {}) =>
    t
      .withIdentity(asUser(fx.memberId))
      .query(api.features.materi.skills.searchSkills, { tenantId: fx.tenantId, q, ...extra });

  expect((await call("ringkas", { tag: "produktivitas" })).map((c) => c.title)).toEqual([
    "Ringkas Rapat",
  ]);
  expect(await call("ringkas", { tag: "coding" })).toEqual([]);
  expect(await call("ringkas", { tag: "!!!" })).toEqual([]);

  // Both skills match "a"… well, "ka": ordering is the assertion here.
  expect((await call("ka", { sort: "title" })).map((c) => c.title)).toEqual([
    "Review Kode",
    "Ringkas Rapat",
  ]);
  expect((await call("ka", { sort: "oldest" })).map((c) => c.title)).toEqual([
    "Review Kode",
    "Ringkas Rapat",
  ]);
  expect((await call("ka", { sort: "newest" })).map((c) => c.title)).toEqual([
    "Ringkas Rapat",
    "Review Kode",
  ]);
});

test("searchSkills: another community's skills are outside the index range", async () => {
  const t = setup();
  const fx = await seedSkills(t);
  const other = await seedTenantFixture(t, "komunitas-lain");
  await seedMateri(t, other, {
    slug: "asing",
    title: "Skill Asing",
    status: "published",
    kind: "skill",
    promptText: "Prompt milik komunitas lain — kata kunci: keamanan.",
  });

  const hits = await t
    .withIdentity(asUser(fx.memberId))
    .query(api.features.materi.skills.searchSkills, { tenantId: fx.tenantId, q: "keamanan" });
  expect(hits.map((c) => c.title)).toEqual(["Review Kode"]);
});

test("getPrompt: anon and outsider denied; member gets the prompt, draft is NOT_FOUND", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const skillId = await seedMateri(t, fx, {
    slug: "review-kode",
    title: "Review Kode",
    status: "published",
    kind: "skill",
    promptText: PROMPT,
  });
  const draftId = await seedMateri(t, fx, {
    slug: "draf",
    title: "Draf",
    status: "draft",
    kind: "skill",
    promptText: "Belum siap.",
  });

  await expect(
    t.query(api.features.materi.skills.getPrompt, { lessonId: skillId })
  ).rejects.toThrow(/NOT_AUTHENTICATED/);
  await expect(
    t
      .withIdentity(asUser(fx.outsiderId))
      .query(api.features.materi.skills.getPrompt, { lessonId: skillId })
  ).rejects.toThrow(/NOT_AUTHORIZED/);

  const asMember = t.withIdentity(asUser(fx.memberId));
  expect(await asMember.query(api.features.materi.skills.getPrompt, { lessonId: skillId })).toEqual(
    { kind: "skill", title: "Review Kode", slug: "review-kode", promptText: PROMPT }
  );
  await expect(
    asMember.query(api.features.materi.skills.getPrompt, { lessonId: draftId })
  ).rejects.toThrow(/NOT_FOUND/);
  expect(
    (
      await t
        .withIdentity(asUser(fx.instructorId))
        .query(api.features.materi.skills.getPrompt, { lessonId: draftId })
    ).promptText
  ).toBe("Belum siap.");
});

test("getPrompt: a plain materi answers kind materi with a null prompt", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const lessonId = await seedMateri(t, fx, { slug: "biasa", status: "published" });

  const result = await t
    .withIdentity(asUser(fx.memberId))
    .query(api.features.materi.skills.getPrompt, { lessonId });
  expect(result.kind).toBe("materi");
  expect(result.promptText).toBeNull();
});
