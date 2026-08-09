// posts feature — MANDATORY per-user-per-day post cap (DECISIONS #33: "Cap post
// per user WAJIB ikut saat model `posts` mendarat"). Joining a community is open
// self-serve (features/tenants/mutations.ts: requireUser + status === "active"),
// the feed is anonymously readable AND listed in sitemap.xml, and moderation is
// one volunteer doing post-hoc soft-deletes. An uncapped feed is a link-spam
// target by construction.
//
// Counted EXACTLY, never a bounded window over the OLDEST rows (the Fase-0
// repo-wide fix): the scan runs on by_author — the caller's own rows only —
// ordered NEWEST-FIRST, and stops at DAY_MS. Soft-deleted posts still count:
// delete-and-repost must not reset the guard.
import type { Doc, Id } from "../../_generated/dataModel";
import type { MutationCtx } from "../../_generated/server";
import { fail } from "./errors";

export const DAY_MS = 24 * 60 * 60 * 1000;

/** Plain text/discussion posts a user may create per rolling 24h. */
export const MAX_POSTS_PER_DAY = 10;
/**
 * Stricter cap for posts carrying a linkUrl. Link posts are the payload spammers
 * actually want (SEO backlinks off an indexable page), so they get their own,
 * tighter budget inside the same 24h window.
 */
export const MAX_LINK_POSTS_PER_DAY = 3;

/**
 * Newest-first scan bound. Reading MAX_POSTS_PER_DAY + 1 of the caller's own
 * rows answers the total cap EXACTLY (we only compare against the cap), and it
 * also makes the link count exact: if fewer than that many rows fall inside the
 * window we hold every one of them, and if more do, the total cap has already
 * fired. Constant cost, no matter how prolific the author.
 */
export const SCAN_TAKE = MAX_POSTS_PER_DAY + 1;

export type DailyPostUsage = {
  /** Caller's posts inside the window, saturating at SCAN_TAKE. */
  total: number;
  /** Caller's posts inside the window that carry a linkUrl (exact below the total cap). */
  withLink: number;
};

/**
 * Count the caller's posts in the last 24h (all tenants — by_author has no
 * tenant column, and a global budget is the STRICTER reading, so it can never
 * be bypassed by hopping communities).
 * TODO(rr): confirm — daily budget is per USER globally, not per user per
 * tenant; add a by_author_tenant index first if per-tenant budgets are wanted.
 */
export async function countRecentPostsByUser(
  ctx: MutationCtx,
  authorId: Id<"users">,
  now: number
): Promise<DailyPostUsage> {
  const rows: Doc<"posts">[] = await ctx.db
    .query("posts")
    .withIndex("by_author", (q) => q.eq("authorId", authorId))
    .order("desc") // NEWEST first — the caller's fresh rows can never fall outside
    .take(SCAN_TAKE);
  const since = now - DAY_MS;
  const inWindow = rows.filter((p) => p._creationTime >= since);
  return {
    total: inWindow.length,
    withLink: inWindow.reduce((n, p) => (p.linkUrl !== undefined ? n + 1 : n), 0),
  };
}

/** Reject the write when the caller is already at/over either daily cap. */
export function assertUnderDailyPostLimit(usage: DailyPostUsage, hasLink: boolean): void {
  if (usage.total >= MAX_POSTS_PER_DAY) {
    fail(
      "RATE_LIMITED",
      `Maksimal ${MAX_POSTS_PER_DAY} post per hari — lanjutkan obrolan cepat di Discord ya`
    );
  }
  if (hasLink && usage.withLink >= MAX_LINK_POSTS_PER_DAY) {
    fail(
      "RATE_LIMITED",
      `Maksimal ${MAX_LINK_POSTS_PER_DAY} post bertautan per hari — bagikan sumber seperlunya saja`
    );
  }
}
