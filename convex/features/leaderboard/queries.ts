// leaderboard feature — Peringkat (#30). READ-ONLY SLICE: it never writes
// memberships.points. Points are patched by the like mutation that earns them
// (DATA-MODEL access table: "sistem saja — di-patch oleh mutation like, tidak
// pernah ditulis client"); this feature only ranks what is already there, which
// is why it ships no mutation at all.
//
// NO ANONYMOUS SURFACE. This slice deliberately has none.
//
// An earlier pass shipped `publicListTop` as an anonymous etalase read on the
// grounds that displayName/username/avatarUrl are already public at
// /u/<username>. That reasoning is wrong: §6 condition (3) forbids "member
// lists" outright, and the leak is not the profile fields — it is the
// MEMBERSHIP EDGE. An anonymous board answers "who belongs to this community
// and how active are they", which no public surface answers today, for every
// community on a site that now publishes a sitemap. Both functions are
// member+, authenticated on their first line. Mutations NEVER qualify (§6) —
// there are none.
//
// Reading the shared `profiles` table for the display join is sanctioned
// (table access ≠ code import; precedent: comments/queries.ts — AGENTS.md §4).
import { v } from "convex/values";
import { query } from "../../_generated/server";
import { requireActiveTenantById, requireTenantRole } from "../../_shared/auth";
import { RANK_SCAN_CAP, TOP_TAKE } from "./constants";
import { deriveLevel, deriveLevelInfo } from "./derive";

/** Explicit safe projection — one row of the board. */
export type LeaderboardEntry = {
  /** Competition rank: ties share a rank, the next distinct score skips. */
  rank: number;
  points: number;
  level: number;
  displayName: string;
  username: string;
  avatarUrl: string | null;
};

export type MyRank = {
  points: number;
  level: number;
  /** null when the caller is further down than RANK_SCAN_CAP. */
  rank: number | null;
  nextLevelAt: number | null;
  pointsToNext: number | null;
};

/**
 * Top scorers of a community, highest first. MEMBER+ — see the header.
 *
 * `.gte("points", 0)` is not cosmetic: in Convex a MISSING optional field sorts
 * before every number, so the range STRUCTURALLY excludes members who have
 * never scored. They are not fabricated into the table as zeros — an empty
 * board renders "belum ada poin", which is the honest state of a young
 * community, not a wall of 0-point rows.
 */
export const listTop = query({
  args: { tenantId: v.id("tenants") },
  handler: async (ctx, args): Promise<LeaderboardEntry[]> => {
    await requireTenantRole(ctx, args.tenantId, "member"); // FIRST line (P0 §6)
    await requireActiveTenantById(ctx, args.tenantId); // suspended → NOT_FOUND
    const scored = await ctx.db
      .query("memberships")
      .withIndex("by_tenant_points", (q) => q.eq("tenantId", args.tenantId).gte("points", 0))
      .order("desc")
      .take(TOP_TAKE);

    const entries: LeaderboardEntry[] = [];
    let rank = 0;
    let lastPoints = Number.NaN;
    for (let i = 0; i < scored.length; i++) {
      const membership = scored[i];
      const points = membership.points ?? 0; // the range already excluded undefined
      // Competition ranking, so this board agrees with getMyRank (which counts
      // how many members score strictly higher). Computed from the INDEX
      // position, so a scorer without a profile still consumes their rank.
      if (points !== lastPoints) {
        rank = i + 1;
        lastPoints = points;
      }
      const profile = await ctx.db
        .query("profiles")
        .withIndex("by_user", (q) => q.eq("userId", membership.userId))
        .unique();
      if (profile === null) continue; // no public identity → no card to show
      entries.push({
        rank,
        points,
        level: deriveLevel(points),
        displayName: profile.displayName,
        username: profile.username,
        avatarUrl: profile.avatarUrl ?? null,
      });
    }
    return entries;
  },
});

/**
 * The caller's own standing — MEMBER+ of the tenant (requireTenantRole is the
 * first handler line, and it rejects anonymous callers via requireUser).
 * Rank is derived, never stored: it is 1 + the number of members who score
 * strictly higher, read as one bounded index range.
 */
export const getMyRank = query({
  args: { tenantId: v.id("tenants") },
  handler: async (ctx, args): Promise<MyRank> => {
    const { membership } = await requireTenantRole(ctx, args.tenantId, "member");
    const points = membership.points ?? 0; // pre-#30 rows have no points field
    const ahead = await ctx.db
      .query("memberships")
      .withIndex("by_tenant_points", (q) => q.eq("tenantId", args.tenantId).gt("points", points))
      .take(RANK_SCAN_CAP + 1); // +1 distinguishes "exactly at the cap" from "beyond it"
    const info = deriveLevelInfo(points);
    return {
      points,
      level: info.level,
      rank: ahead.length > RANK_SCAN_CAP ? null : ahead.length + 1,
      nextLevelAt: info.nextLevelAt,
      pointsToNext: info.pointsToNext,
    };
  },
});
