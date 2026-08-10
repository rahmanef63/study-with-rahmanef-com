// materi feature — THE ONE WRITE PATH FOR MATERI BODY CONTENT (DECISIONS #38).
//
// ── THE STORAGE INVARIANT ────────────────────────────────────────────────────
// `contentBlocks` (notion block JSON) is CANONICAL when present. `contentMd` is
// DERIVED from it, by this mutation, in the same transaction as the block write.
// The two therefore cannot disagree: there is no code path that patches one
// without recomputing the other. That is why `courses/lessons.updateLesson`
// deliberately refuses `contentBlocks`, and why nothing else may patch
// `contentMd` on a materi that has blocks.
//
// Why derive server-side instead of trusting a client-computed markdown string:
// `contentMd` is what `lessons.searchIndex("search_content")` indexes and what
// the anonymous reader path renders. A client that sends mismatched md would be
// poisoning search with text that is not in the document. The serialiser is the
// slice's own `blocksToMarkdown` (pure, no React, no DOM) imported directly, so
// the editor and the server run the SAME grammar rather than two that drift.
import { v } from "convex/values";
import { mutation } from "../../_generated/server";
import { internal } from "../../_generated/api";
import type { Doc, Id } from "../../_generated/dataModel";
import type { MutationCtx } from "../../_generated/server";
import { requireTenantRole, requireUser } from "../../_shared/auth";
import { fail } from "./errors";
import { extractMateriSlugs, MAX_LINK_SCAN_CHARS } from "./materiLinks";
import { blocksToMarkdown } from "../../../slices/notion-app/shared/lib/markdown/toMarkdown";
import type { Block } from "../../../slices/notion-app/shared/types/blocks";

/** Largest `contentBlocks` payload accepted. A Convex document is capped at
 *  1 MB and this row also carries the derived markdown, so the JSON gets well
 *  under half. The biggest production body today is ~14 KB. */
export const MAX_CONTENT_BLOCKS_CHARS = MAX_LINK_SCAN_CHARS;
/** Top-level blocks per materi. A document past this is a paste accident. */
export const MAX_BLOCKS_PER_MATERI = 2000;

/**
 * Instructor+ of the materi's OWN tenant. FIRST line of the handler, and it
 * authenticates BEFORE the by-id read so an anonymous caller cannot use
 * 404-vs-403 as an existence oracle.
 *
 * Instructor+, not `requireAuthorOrInstructor`: the block editor loads through
 * `courses/manage.getLessonForManage`, which is instructor+. A member-author who
 * could save but not open would be a worse seam than no seam.
 */
async function requireInstructorForMateri(
  ctx: MutationCtx,
  lessonId: Id<"lessons">,
): Promise<{ userId: Id<"users">; lesson: Doc<"lessons"> }> {
  await requireUser(ctx); // auth BEFORE any domain read
  const lesson = await ctx.db.get(lessonId);
  if (lesson === null) fail("NOT_FOUND", "Materi tidak ditemukan");
  const { userId } = await requireTenantRole(ctx, lesson.tenantId, "instructor");
  return { userId, lesson };
}

/** Parse + shape-guard the client payload. Anything that is not a JSON array of
 *  objects with a string `type` is VALIDATION_FAILED, never a partial write. */
function parseBlocks(contentBlocks: string): Block[] {
  if (contentBlocks.length > MAX_CONTENT_BLOCKS_CHARS) {
    fail("VALIDATION_FAILED", "Isi materi terlalu panjang untuk disimpan");
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(contentBlocks);
  } catch {
    fail("VALIDATION_FAILED", "Format blok materi tidak valid");
  }
  if (!Array.isArray(parsed)) {
    fail("VALIDATION_FAILED", "Format blok materi tidak valid");
  }
  if (parsed.length > MAX_BLOCKS_PER_MATERI) {
    fail("VALIDATION_FAILED", `Maksimal ${MAX_BLOCKS_PER_MATERI} blok per materi`);
  }
  for (const block of parsed) {
    if (typeof block !== "object" || block === null) {
      fail("VALIDATION_FAILED", "Format blok materi tidak valid");
    }
    const { id, type } = block as { id?: unknown; type?: unknown };
    if (typeof id !== "string" || typeof type !== "string") {
      fail("VALIDATION_FAILED", "Format blok materi tidak valid");
    }
  }
  return parsed as Block[];
}

/**
 * Save the block body of one materi.
 *
 * Order matters and is the point of the function:
 *   1. authz;
 *   2. validate + parse;
 *   3. derive markdown from the blocks;
 *   4. patch BOTH columns in one write;
 *   5. reconcile `lessonRefs` from the links in the markdown we just derived,
 *      so "muncul di materi lain" is true of the content as saved rather than
 *      of whatever the client claimed it linked to.
 *
 * `syncRefs` is an internalMutation — unreachable from a client — and this
 * handler is its authorised caller: the instructor check above has already run.
 */
export const saveContent = mutation({
  args: { lessonId: v.id("lessons"), contentBlocks: v.string() },
  // The explicit return type is load-bearing, not decoration: this handler
  // calls another Convex function through `internal`, so without it TypeScript
  // has to resolve `api`/`internal` to type this function while typing this
  // function — a cycle it answers with `any`, which then leaks out through
  // _generated/api.d.ts and turns the whole repo implicit-any.
  handler: async (
    ctx,
    args,
  ): Promise<{ lessonId: Id<"lessons">; contentMd: string; refs: number }> => {
    const { lesson } = await requireInstructorForMateri(ctx, args.lessonId);

    const blocks = parseBlocks(args.contentBlocks);
    const contentMd = blocksToMarkdown(blocks);

    await ctx.db.patch(lesson._id, { contentBlocks: args.contentBlocks, contentMd });

    // The tenant read is what anchors link extraction to THIS community's
    // canonical URL prefix; see materiLinks for why a foreign prefix must not
    // resolve against our slugs.
    const tenant = await ctx.db.get(lesson.tenantId);
    const slugs = tenant === null ? [] : extractMateriSlugs(contentMd, tenant.slug);

    const toLessonIds: Array<Id<"lessons">> = [];
    for (const slug of slugs) {
      const target = await ctx.db
        .query("lessons")
        .withIndex("by_tenant_slug", (q) =>
          q.eq("tenantId", lesson.tenantId).eq("slug", slug),
        )
        .first();
      // A link to a slug nobody has written yet is not an error — the author
      // may be writing the two materi in either order.
      if (target !== null && target._id !== lesson._id) toLessonIds.push(target._id);
    }
    const refs: { refs: number; added: number; removed: number } = await ctx.runMutation(
      internal.features.materi.refs.syncRefs,
      { lessonId: lesson._id, toLessonIds },
    );

    return { lessonId: lesson._id, contentMd, refs: refs.refs };
  },
});
