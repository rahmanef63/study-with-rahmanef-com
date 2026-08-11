/// <reference types="vite/client" />
// seed:seedSkills — the shelf gets stocked once, and only once.
//
// The claim that matters for the deploy: seed CODE is not seed DATA, and
// production will run this mutation against a database that may already hold
// the rows. So every spec here either runs the mutation TWICE and asserts the
// second run wrote nothing, or asserts a property of the authored catalogue
// that must hold before it is ever run against prod.
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { internal } from "../_generated/api";
import schema from "../schema";
import { MAX_PROMPT_CHARS, MAX_TAGS_PER_LESSON } from "../features/materi/validate";
import { BELAJAR_AI_SKILLS } from "./skillsData";

const modules = import.meta.glob([
  "/convex/**/*.{js,ts}",
  "!/convex/**/*.test.ts",
  "!/convex/**/*.d.ts",
]);

const bootstrapArgs = {
  ownerEmail: "rahmanef63@gmail.com",
  username: "rahman",
  displayName: "Rahman",
  tenantSlug: "belajar-ai",
  tenantName: "Belajar AI bareng Rahman",
  tenantDescription: "Komunitas belajar pengaplikasian AI untuk semua orang.",
};
const seedArgs = { ownerEmail: bootstrapArgs.ownerEmail, tenantSlug: bootstrapArgs.tenantSlug };

async function bootstrapped() {
  const t = convexTest(schema, modules);
  await t.run(async (ctx) => {
    await ctx.db.insert("users", { email: bootstrapArgs.ownerEmail });
  });
  await t.mutation(internal.seed.bootstrap, bootstrapArgs);
  return t;
}
type T = Awaited<ReturnType<typeof bootstrapped>>;

/** Every row the skills seed can touch, as a comparable snapshot. Row IDS are
 *  part of it: a delete-and-reinsert would keep the counts and fail here. */
async function census(t: T) {
  return t.run(async (ctx) => {
    const lessons = await ctx.db.query("lessons").collect();
    const tags = await ctx.db.query("lessonTags").collect();
    return {
      lessons: lessons.length,
      skills: lessons.filter((l) => l.kind === "skill").length,
      tags: tags.length,
      placements: (await ctx.db.query("courseLessons").collect()).length,
      rows: [
        ...lessons.map((l) => `${l._id}|${l.slug}|${l.kind}|${l.promptText?.length ?? 0}`),
        ...tags.map((row) => `${row._id}|${row.tag}|${row.lessonId}`),
      ]
        .sort()
        .join(","),
    };
  });
}

const TOTAL_TAGS = BELAJAR_AI_SKILLS.reduce((n, s) => n + s.tags.length, 0);

describe("seed:seedSkills", () => {
  test("stocks the library, then a re-run writes nothing", async () => {
    const t = await bootstrapped();

    const first = await t.mutation(internal.seed.seedSkills, seedArgs);
    expect(first.skills).toBe(BELAJAR_AI_SKILLS.length);
    expect(first.tags).toBe(TOTAL_TAGS);
    const after = await census(t);
    expect(after.skills).toBe(BELAJAR_AI_SKILLS.length);
    expect(after.tags).toBe(TOTAL_TAGS);

    const second = await t.mutation(internal.seed.seedSkills, seedArgs);
    expect(second).toMatchObject({ skills: 0, tags: 0 });
    expect(await census(t)).toEqual(after);
  });

  test("a skill is a materi with kind + prompt, and is placed in no course", async () => {
    const t = await bootstrapped();
    await t.mutation(internal.seed.seedSkills, seedArgs);

    const rows = await t.run(async (ctx) => {
      const lessons = await ctx.db.query("lessons").collect();
      const placements = await ctx.db.query("courseLessons").collect();
      const placed = new Set(placements.map((p) => p.lessonId));
      return lessons.map((l) => ({
        slug: l.slug,
        kind: l.kind,
        status: l.status,
        prompt: l.promptText ?? "",
        body: l.contentMd,
        isPlaced: placed.has(l._id),
      }));
    });

    expect(rows).toHaveLength(BELAJAR_AI_SKILLS.length);
    for (const row of rows) {
      expect(row.kind).toBe("skill");
      expect(row.status).toBe("published"); // visible on the shelf, not a draft
      expect(row.prompt.length).toBeGreaterThan(0);
      expect(row.body.length).toBeGreaterThan(0);
      expect(row.isPlaced).toBe(false); // placement is orthogonal (DECISIONS #36)
    }
  });

  test("tags land on the tag index the library browses by", async () => {
    const t = await bootstrapped();
    await t.mutation(internal.seed.seedSkills, seedArgs);

    const tagged = await t.run(async (ctx) => {
      const tenant = await ctx.db
        .query("tenants")
        .withIndex("by_slug", (q) => q.eq("slug", seedArgs.tenantSlug))
        .unique();
      if (tenant === null) throw new Error("no tenant");
      return ctx.db
        .query("lessonTags")
        .withIndex("by_tenant_tag", (q) => q.eq("tenantId", tenant._id).eq("tag", "kerja"))
        .collect();
    });
    const expected = BELAJAR_AI_SKILLS.filter((s) => s.tags.includes("kerja")).length;
    expect(expected).toBeGreaterThan(0);
    expect(tagged).toHaveLength(expected);
  });

  test("re-seeding restores a tag an earlier run never wrote, and nothing else", async () => {
    const t = await bootstrapped();
    await t.mutation(internal.seed.seedSkills, seedArgs);
    const before = await census(t);

    // Simulate a half-written row set: one tag row missing.
    await t.run(async (ctx) => {
      const row = await ctx.db.query("lessonTags").first();
      if (row === null) throw new Error("no tag rows");
      await ctx.db.delete(row._id);
    });

    const repair = await t.mutation(internal.seed.seedSkills, seedArgs);
    expect(repair).toMatchObject({ skills: 0, tags: 1 });
    const after = await census(t);
    expect(after.tags).toBe(before.tags);
    expect(after.lessons).toBe(before.lessons);
  });

  test("a slug already taken by an ordinary materi is a loud failure", async () => {
    const t = await bootstrapped();
    const [first] = BELAJAR_AI_SKILLS;
    await t.run(async (ctx) => {
      const tenant = await ctx.db
        .query("tenants")
        .withIndex("by_slug", (q) => q.eq("slug", seedArgs.tenantSlug))
        .unique();
      if (tenant === null) throw new Error("no tenant");
      await ctx.db.insert("lessons", {
        tenantId: tenant._id,
        title: "Materi lama yang kebetulan sama slug-nya",
        slug: first.slug,
        status: "published",
        contentMd: "…",
        links: [],
      });
    });

    // Silently skipping would leave the skill unwritten forever, with a seed
    // that still reports success.
    await expect(t.mutation(internal.seed.seedSkills, seedArgs)).rejects.toThrow(first.slug);
  });

  test("the authored catalogue is inside every bound the write path enforces", () => {
    expect(BELAJAR_AI_SKILLS.length).toBeGreaterThanOrEqual(12);
    const slugs = new Set<string>();
    const titles = new Set<string>();
    for (const skill of BELAJAR_AI_SKILLS) {
      expect(slugs.has(skill.slug)).toBe(false);
      expect(titles.has(skill.title)).toBe(false);
      slugs.add(skill.slug);
      titles.add(skill.title);
      expect(skill.slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      expect(skill.promptText.trim().length).toBeGreaterThan(0);
      expect(skill.promptText.length).toBeLessThanOrEqual(MAX_PROMPT_CHARS);
      expect(skill.tags.length).toBeGreaterThan(0);
      expect(skill.tags.length).toBeLessThanOrEqual(MAX_TAGS_PER_LESSON);
      for (const tag of skill.tags) expect(tag).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      // The body is the "when / what to change / how it fails" note, not a
      // second copy of the prompt.
      expect(skill.contentMd).toContain("## ");
      expect(skill.contentMd.length).toBeGreaterThan(400);
    }
  });
});
