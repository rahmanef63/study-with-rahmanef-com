// seed:seedSkills — stocks the SKILLS library of one tenant from
// _seed/skillsData.ts. The library shipped with working machinery and zero
// rows, so every community rendered an empty shelf.
//
// ── WHY THIS IS NOT A CURRICULUM ENTRY ───────────────────────────────────────
// A skill is a materi with `kind: "skill"` + `promptText`, and PLACEMENT IS
// ORTHOGONAL (DECISIONS #36): a skill belongs to the tenant's library, not to a
// course, so it has no `courseLessons` row, no order and no course to append
// to. Routing it through `upsertCurriculum` would force a fake course to hang
// it on. Hence this small writer instead — it shares nothing with curriculum.ts
// because there is nothing left to share once placement is gone: the probe is
// by SLUG, not by the title-derived slug ladder (see below).
//
// ── IDEMPOTENCE ──────────────────────────────────────────────────────────────
// Per row, like every other seed here. Production is already seeded and will be
// re-seeded, so nothing is gated on "the library is non-empty":
//   · skill → `lessons.by_tenant_slug`, on the AUTHORED slug;
//   · tag   → `lessonTags.by_tenant_tag_lesson`.
// A second run inserts zero rows. Proven in seedSkills.test.ts, which runs the
// mutation twice and diffs a census.
//
// The slug is authored in the data file rather than derived from the title
// because it is the permalink (/k/<tenant>/skills/<slug>) AND the identity this
// probe matches on: deriving it would mean an editorial title tweak silently
// re-inserts the whole skill under a new slug on the next run. Authored slugs
// are checked against the live materi set; the collision guard below is the
// net, because a probe that finds a NON-skill materi on that slug must not be
// read as "already seeded" (it would skip the skill forever, silently).
import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { assertPromptText, normalizeTags } from "../features/materi/validate";
import { BELAJAR_AI_SKILLS } from "./skillsData";
import { resolveSeedTarget } from "./curriculum";

/**
 * One skill in the starter library. No `links` and no `youtubeVideoId`: a skill
 * is a prompt plus the note explaining it, and every source it needs is named
 * inside `contentMd`.
 */
export type SeedSkill = {
  /** Permalink AND idempotence key. Unique within the tenant. */
  slug: string;
  title: string;
  /** Normalised on write; ≤12 per materi (features/materi/validate). */
  tags: string[];
  /** Copy-able prompt, ≤4 000 chars — asserted here, not just at runtime. */
  promptText: string;
  /** When to use it, what to change, how it fails. */
  contentMd: string;
};

export type SkillResult = { slug: string; skill: 0 | 1; tags: number };

/**
 * Upsert one skill + its tags. Returns what was actually inserted, so a caller
 * can report "0 new" honestly instead of reporting what it intended to write.
 */
export async function upsertSkill(
  ctx: MutationCtx,
  opts: { tenantId: Id<"tenants">; createdBy: Id<"users">; skill: SeedSkill }
): Promise<SkillResult> {
  const { tenantId, createdBy, skill } = opts;
  const made: SkillResult = { slug: skill.slug, skill: 0, tags: 0 };

  // Same guards the real write path runs (features/courses/lessons.createLesson)
  // so a data-file mistake fails in `vitest`, not against production.
  const promptText = assertPromptText(skill.promptText, "skill");
  const tags = normalizeTags(skill.tags);

  const existing = await ctx.db
    .query("lessons")
    .withIndex("by_tenant_slug", (q) => q.eq("tenantId", tenantId).eq("slug", skill.slug))
    .first(); // .first, not .unique: a legacy duplicate must not crash the seed

  if (existing !== null && existing.kind !== "skill") {
    throw new Error(
      `Slug "${skill.slug}" already belongs to a non-skill materi in this tenant — ` +
        "rename the skill in _seed/skillsData.ts rather than re-pointing the URL."
    );
  }

  const lessonId =
    existing?._id ??
    (await ctx.db.insert("lessons", {
      tenantId,
      title: skill.title,
      slug: skill.slug,
      status: "published",
      kind: "skill",
      promptText,
      authorId: createdBy,
      contentMd: skill.contentMd,
      links: [],
    }));
  if (existing === null) made.skill = 1;

  // Tags are probed one by one on the exact (tenant, tag, lesson) index rather
  // than diffed against the row set: seeding ADDS the starter tags and never
  // removes a tag an instructor added later in Kelola.
  for (const tag of tags) {
    const row = await ctx.db
      .query("lessonTags")
      .withIndex("by_tenant_tag_lesson", (q) =>
        q.eq("tenantId", tenantId).eq("tag", tag).eq("lessonId", lessonId)
      )
      .first();
    if (row !== null) continue;
    await ctx.db.insert("lessonTags", { tenantId, tag, lessonId });
    made.tags++;
  }

  return made;
}

export type SeedSkillsArgs = { ownerEmail: string; tenantSlug: string };

/** Stock one tenant's skills library. Only belajar-ai has authored skills so
 *  far; the arg stays a slug so a second community's set is one array away. */
export async function runSeedSkills(ctx: MutationCtx, args: SeedSkillsArgs) {
  const { tenantId, createdBy } = await resolveSeedTarget(ctx, args);
  const made = { skills: 0, tags: 0 };

  for (const skill of BELAJAR_AI_SKILLS) {
    const one = await upsertSkill(ctx, { tenantId, createdBy, skill });
    made.skills += one.skill;
    made.tags += one.tags;
  }

  return {
    note: "skills seed complete (idempotent)",
    tenantSlug: args.tenantSlug,
    authored: BELAJAR_AI_SKILLS.length,
    ...made,
  };
}
