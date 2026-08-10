// materi feature — the SKILLS library's own read surfaces. A skill is a materi
// with `kind: "skill"` plus a `promptText`; browsing, tags, permalinks, OG and
// the sitemap are therefore already handled by library.ts / queries.ts. What is
// NOT handled anywhere else is search, and this file is why.
//
// NOTHING HERE IS ANONYMOUS (AGENTS.md §6): both queries are MEMBER+ and take
// the authz helper as their first line. The etalase whitelist stays exactly the
// two `public*` queries in ./queries.ts — a prompt never leaves this gate.
//
// ── WHY SEARCH IS A BOUNDED SCAN AND NOT AN INDEX ────────────────────────────
// The requirement: a skill must be findable by its TITLE and by its PROMPT.
// `lessons.searchIndex("search_content")` indexes `contentMd`, which contains
// neither. The two ways to make that index answer the question both fail:
//   1. mirror title+promptText into `contentMd`. That breaks DECISIONS #38 at
//      the root: `contentMd` is DERIVED, by exactly one function
//      (`materi/content.saveContent`, from `contentBlocks`). Mirroring gives it
//      three writers — createLesson, updateLesson and saveContent — two of them
//      hand-maintained copies that must re-derive markdown they are explicitly
//      forbidden to touch once blocks exist. "Derived, never hand-maintained"
//      is the whole decision; a mirror is the failure it was written to prevent.
//   2. add a second search index on `promptText` (and a third on `title`).
//      Correct in principle, but the schema change for skills is fixed at
//      `kind` + `promptText` + `by_tenant_kind_status` — nothing else in
//      `_tables/learning.ts` moves.
// So: scan the ONE exact index range the skills library already is, bounded at
// SKILL_SCAN_TAKE, and substring-match in memory. It is exactly as bounded as
// every other read here, it makes "findable by title AND prompt" literally
// true, and substring beats tokenised full-text for prompts anyway — people
// search a prompt for a phrase they remember ("step by step", "role:"), not for
// a stemmed word. The corpus is a curated catalogue of dozens, not the 76-and-
// growing materi corpus, and the per-row payload is capped at 4 000 chars.
// The BODY of a skill stays searchable the ordinary way, through
// features/search.searchInTenant — that index is untouched and still indexes
// contentMd. If prompt text ever needs to be searchable from the global box
// too, the honest fix is a `search_prompt` index, never a mirror.
import { v } from "convex/values";
import type { Doc } from "../../_generated/dataModel";
import { query } from "../../_generated/server";
import { requireTenantRole } from "../../_shared/auth";
import { canSeeMateri, materiKind, requireMemberForLesson } from "./access";
import { sortValidator } from "./library";
import { toCard } from "./links";
import type { MateriCard, MateriKind, MateriSort } from "./projections";
import {
  MAX_SEARCH_RESULTS,
  normalizeSearchQuery,
  normalizeTagFilter,
  SKILL_SCAN_TAKE,
} from "./validate";

/** Title OR prompt, case-insensitive substring. The body is not scanned here:
 *  that is `features/search.searchInTenant`'s indexed job. */
function matches(lesson: Doc<"lessons">, needle: string): boolean {
  if (lesson.title.toLowerCase().includes(needle)) return true;
  return lesson.promptText?.toLowerCase().includes(needle) === true;
}

/** Unlike listLibrary's A→Z, this sort IS global: every match is already in
 *  memory, so ordering happens before the result set is truncated. */
function order(lessons: Doc<"lessons">[], sort: MateriSort): Doc<"lessons">[] {
  if (sort === "title") {
    return [...lessons].sort((a, b) => a.title.localeCompare(b.title, "id"));
  }
  const sign = sort === "oldest" ? 1 : -1;
  return [...lessons].sort((a, b) => sign * (a._creationTime - b._creationTime));
}

/**
 * MEMBER+. Search the skills library by title or prompt text, optionally within
 * one tag, ordered the same three ways as the library.
 *
 * NOT paginated, by design: it returns the top MAX_SEARCH_RESULTS matches of a
 * bounded scan and stops. A cursor over a filter that lives in memory would be
 * a promise the query cannot keep, and a search box wants one page.
 *
 * Instructor+ sees draft skills here exactly as they do in the library — the
 * visibility contract is `canSeeMateri`, the same predicate, applied to every
 * candidate before it is projected.
 */
export const searchSkills = query({
  args: {
    tenantId: v.id("tenants"),
    q: v.string(),
    tag: v.optional(v.string()),
    sort: v.optional(sortValidator),
  },
  handler: async (ctx, args): Promise<MateriCard[]> => {
    const { membership } = await requireTenantRole(ctx, args.tenantId, "member"); // authz FIRST (P0)
    const role = membership.role;
    const needle = normalizeSearchQuery(args.q); // 2–60 chars → VALIDATION_FAILED

    let candidates: Doc<"lessons">[];
    if (args.tag === undefined) {
      candidates = await ctx.db
        .query("lessons")
        .withIndex("by_tenant_kind_status", (q) =>
          q.eq("tenantId", args.tenantId).eq("kind", "skill")
        )
        .order("desc")
        .take(SKILL_SCAN_TAKE);
    } else {
      const tag = normalizeTagFilter(args.tag);
      if (tag === null) return []; // a filter that cannot be a tag matches nothing
      const rows = await ctx.db
        .query("lessonTags")
        .withIndex("by_tenant_tag", (q) => q.eq("tenantId", args.tenantId).eq("tag", tag))
        .order("desc")
        .take(SKILL_SCAN_TAKE);
      const seen = new Set<string>();
      candidates = [];
      for (const row of rows) {
        if (seen.has(row.lessonId)) continue;
        seen.add(row.lessonId);
        const lesson = await ctx.db.get(row.lessonId);
        // Tag rows carry tenantId, but the lesson is the authority on tenancy.
        if (lesson === null || lesson.tenantId !== args.tenantId) continue;
        if (materiKind(lesson) !== "skill") continue;
        candidates.push(lesson);
      }
    }

    const hits = candidates.filter(
      (lesson) => canSeeMateri(lesson, role) && matches(lesson, needle)
    );
    // Project AFTER truncating: each card costs two more index reads.
    const top = order(hits, args.sort ?? "newest").slice(0, MAX_SEARCH_RESULTS);
    const cards: MateriCard[] = [];
    for (const lesson of top) cards.push(await toCard(ctx, lesson));
    return cards;
  },
});

/**
 * MEMBER+. The prompt of one skill, by id — what the copy panel reads, and what
 * the instructor editor reads back to prefill its form (the manage surface
 * loads a lesson by id, not by slug, and `courses/manage.getLessonForManage`
 * belongs to another slice).
 *
 * Member+, not instructor+: the prompt IS the thing membership buys. Draft
 * skills stay NOT_FOUND below instructor level — `requireMemberForLesson`
 * applies the visibility contract before returning anything.
 */
export const getPrompt = query({
  args: { lessonId: v.id("lessons") },
  handler: async (
    ctx,
    args
  ): Promise<{ kind: MateriKind; title: string; slug: string | null; promptText: string | null }> => {
    const { lesson } = await requireMemberForLesson(ctx, args.lessonId); // authz FIRST (P0)
    return {
      kind: materiKind(lesson),
      title: lesson.title,
      slug: lesson.slug ?? null,
      promptText: lesson.promptText ?? null,
    };
  },
});
