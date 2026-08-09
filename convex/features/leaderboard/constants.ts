// leaderboard feature — by-design read bounds (no bare .collect(), P0 §6).

/** Rows on the public board. "Top 50" is the whole product surface (#30). */
export const TOP_TAKE = 50;

/**
 * Ceiling on the "how many members are ahead of me?" scan in getMyRank. The
 * scan is an index RANGE (points strictly greater than mine), so it only walks
 * members who actually outrank the caller. Past the ceiling the exact number
 * stops being interesting — the query returns rank: null and the UI says
 * "di luar 500 besar" instead of paginating a number nobody reads.
 */
export const RANK_SCAN_CAP = 500;
