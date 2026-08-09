// posts feature — legacy-board → `posts` row mapping for the one-shot backfill
// (v1.8 #33). Split out of backfill.ts so both the migrating mutation and the
// `remaining` verification query share ONE definition of "which post is this
// legacy row?" — if the two ever disagreed, `remaining` would report 0 while
// rows were still unmigrated.
//
// IDEMPOTENCY KEY: (tenantId, authorId, kind, title). See backfill.ts for why
// this and not a stored cursor.
import type { Doc, Id } from "../../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../../_generated/server";

type Ctx = QueryCtx | MutationCtx;

/** The natural key a legacy row maps onto in `posts`. */
export type PostKey = {
  tenantId: Id<"tenants">;
  authorId: Id<"users">;
  kind: Doc<"posts">["kind"];
  title: string;
};

/**
 * Bound on the per-author scan behind the key probe. The lookup runs on
 * `by_author` — the ONE author of the legacy row, not the tenant — so this is a
 * targeted read, not a table scan (P0: no bare .collect()). An author with more
 * than this many posts would start producing false "not migrated" answers, so
 * `remaining` surfaces the saturation instead of silently under-reporting.
 */
/**
 * The already-migrated post for this key, or null.
 *
 * EXACT lookup through by_author_kind_title, not a bounded scan. A scan version
 * of this read cost up to 200 documents PER SOURCE ROW nested inside a batch of
 * 100, i.e. up to 20,000 reads in one mutation (Convex's per-transaction
 * ceiling is 16,384), and it stopped matching entirely once an author held more
 * posts than the window — which quietly turned the "safe to replay" guarantee
 * into a double-insert. This is O(1) per source row.
 *
 * tenantId is verified after the index hit rather than being part of the key:
 * the same (author, kind, title) in two communities is vanishingly rare, and
 * the extra index column would only pay off in that case.
 */
export async function findMigratedPost(
  ctx: Ctx,
  key: PostKey
): Promise<Doc<"posts"> | null> {
  const hit = await ctx.db
    .query("posts")
    .withIndex("by_author_kind_title", (q) =>
      q.eq("authorId", key.authorId).eq("kind", key.kind).eq("title", key.title)
    )
    .first();
  return hit !== null && hit.tenantId === key.tenantId ? hit : null;
}

export function announcementKey(row: Doc<"announcements">): PostKey {
  return {
    tenantId: row.tenantId,
    authorId: row.createdBy,
    kind: "pengumuman",
    title: row.title,
  };
}

export function resourceKey(row: Doc<"resources">): PostKey {
  return { tenantId: row.tenantId, authorId: row.submittedBy, kind: "sumber", title: row.title };
}

export function suggestionKey(row: Doc<"suggestions">): PostKey {
  return { tenantId: row.tenantId, authorId: row.submittedBy, kind: "usulan", title: row.title };
}

/** Fields a migrated post carries beyond its key. */
type PostBody = { bodyMd: string; linkUrl?: string; pinned: boolean; lastActivityAt: number };

/**
 * Insert the post for a legacy row unless it is already there. Returns true
 * when a row was actually written, so the caller can report real progress.
 * `lastActivityAt` is the SOURCE row's `_creationTime`, never `Date.now()` —
 * otherwise the whole migrated feed would sort as if posted at backfill time.
 */
async function insertOnce(ctx: MutationCtx, key: PostKey, body: PostBody): Promise<boolean> {
  if ((await findMigratedPost(ctx, key)) !== null) return false;
  await ctx.db.insert("posts", {
    ...key,
    bodyMd: body.bodyMd,
    linkUrl: body.linkUrl,
    pinned: body.pinned,
    lastActivityAt: body.lastActivityAt,
    likeCount: 0,
    commentCount: 0,
  });
  return true;
}

/**
 * announcements → posts(kind "pengumuman"), PINNED. They were a dedicated board
 * with its own tab, so they keep that prominence in the merged feed; an
 * instructor can unpin any of them post-hoc with posts:togglePin.
 */
export async function migrateAnnouncement(
  ctx: MutationCtx,
  row: Doc<"announcements">
): Promise<boolean> {
  return insertOnce(ctx, announcementKey(row), {
    bodyMd: row.bodyMd,
    pinned: true,
    lastActivityAt: row._creationTime,
  });
}

/**
 * resources → posts(kind "sumber"). STATUS HANDLING (DECISIONS #33 — the point
 * of retiring the curation gate):
 *   - "approved" → migrated, obviously.
 *   - "pending"  → MIGRATED TOO. The gate is gone, so a member's submission
 *     that was sitting in a curator's queue should simply appear. Leaving these
 *     behind would reproduce the exact bug #33 exists to kill: a member's own
 *     submission invisible to the member who wrote it.
 *   - "rejected" → SKIPPED. A curator already made an explicit negative call on
 *     that row; resurrecting it into a public, anonymously-readable feed would
 *     be a moderation regression, not a liberation. The rows stay in the source
 *     table until the integrator drops it.
 * Returns false for a skipped rejected row — same as "already migrated", which
 * is what `remaining` needs it to mean.
 */
export async function migrateResource(
  ctx: MutationCtx,
  row: Doc<"resources">
): Promise<boolean> {
  if (row.status === "rejected") return false;
  return insertOnce(ctx, resourceKey(row), {
    bodyMd: row.note ?? "",
    linkUrl: row.url,
    pinned: false,
    lastActivityAt: row._creationTime,
  });
}

/**
 * suggestions → posts(kind "usulan"). EVERY status migrates; the
 * open/planned/done/rejected wording is lost by design (#33 — moderation is
 * post-hoc now, and a suggestion's state was never anything but a label).
 */
export async function migrateSuggestion(
  ctx: MutationCtx,
  row: Doc<"suggestions">
): Promise<boolean> {
  return insertOnce(ctx, suggestionKey(row), {
    bodyMd: row.detail ?? "",
    pinned: false,
    lastActivityAt: row._creationTime,
  });
}
