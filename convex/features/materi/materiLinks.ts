// materi feature — pull materi→materi references out of saved content.
//
// WHY IT SCANS THE MARKDOWN AND NOT THE BLOCK TREE. `saveContent` derives
// `contentMd` from the blocks in the same transaction, so by the time this runs
// the markdown IS the content — every link a reader can click has been
// serialised into it (`[label](url)`, `![caption](url)`, autolinks), including
// links nested inside toggles, columns and table cells, because
// `blocksToMarkdown` recurses. Scanning one flat string instead of walking an
// arbitrary-depth `unknown` tree means there is no second traversal that can
// disagree with the first, and no shape assumptions about client JSON.
//
// The only thing the markdown drops is structural-only blocks (page/database/
// button/synced/toc). A `button` block's url is an ACTION target, not a
// citation, so leaving it out of the backlink graph is correct, not a gap.
import { MAX_REFS_PER_LESSON } from "./validate";

/** Longest content string scanned for links. Well past a real materi (the
 *  biggest production body is ~14 KB) and it bounds a pathological regex walk
 *  on a hostile payload. `saveContent` rejects bodies larger than this anyway. */
export const MAX_LINK_SCAN_CHARS = 400_000;

/** Kebab slug, same grammar as `isLessonSlug`. The trailing lookahead stops a
 *  DEEPER path (`/materi/foo/bar`) and a longer slug from matching a prefix. */
const SLUG_BODY = "[a-z0-9]+(?:-[a-z0-9]+)*";

/** Escape a tenant slug for literal use inside the RegExp. Tenant slugs are
 *  kebab-case by construction, but this is a value that reaches a regex — it
 *  gets escaped regardless of what the schema currently promises. */
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Canonical materi slugs referenced by `content`, in first-appearance order,
 * deduped, capped at MAX_REFS_PER_LESSON.
 *
 * Matches the CANONICAL materi URL only — `/k/<tenantSlug>/materi/<slug>` —
 * anchored to the AUTHOR'S OWN tenant slug. A link into another community's
 * materi is deliberately not a reference: `lessonRefs` is a per-tenant graph
 * and `syncRefs` would drop the row anyway, but matching the tenant segment
 * here also stops `/k/other/materi/prompting` from silently resolving against
 * OUR `prompting` and minting a backlink nobody wrote.
 *
 * The in-course reading URL (`/k/<t>/kelas/<course>/<lessonId>`) is NOT matched:
 * it is one of several paths to the same materi, and the backlink graph keys on
 * the canonical one.
 */
export function extractMateriSlugs(content: string, tenantSlug: string): string[] {
  if (content === "" || tenantSlug === "") return [];
  const scanned =
    content.length > MAX_LINK_SCAN_CHARS ? content.slice(0, MAX_LINK_SCAN_CHARS) : content;
  const re = new RegExp(
    `/k/${escapeRegExp(tenantSlug)}/materi/(${SLUG_BODY})(?![a-z0-9/-])`,
    "g",
  );

  const out: string[] = [];
  const seen = new Set<string>();
  for (const match of scanned.matchAll(re)) {
    const slug = match[1];
    if (slug === undefined || seen.has(slug)) continue;
    seen.add(slug);
    out.push(slug);
    if (out.length >= MAX_REFS_PER_LESSON) break;
  }
  return out;
}
