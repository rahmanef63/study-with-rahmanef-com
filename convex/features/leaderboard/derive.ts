// leaderboard feature — the derivation core (Peringkat, #30).
//
// LEVEL IS DERIVED FROM POINTS AND NEVER STORED (docs/DATA-MODEL.md "Derivasi &
// invarian"; same rule as convex/features/progress/derive.ts). This module is
// PURE — no ctx, no I/O, no storage — so the frontend can import
// LEVEL_THRESHOLDS and render "N poin lagi ke level X" without a round trip,
// and the query and the UI can never disagree about what a level means.
//
// ─────────────────────────────────────────────────────────────────────────────
// DELIBERATELY ABSENT, DO NOT ADD: any level GATE on content. No
// `courses.unlockLevel`, no "level 3 membuka modul lanjutan", no level check in
// any read path. Locking free educational material behind engagement points
// contradicts PRD §2.1 (charity, gratis) and the owner refused it explicitly
// (DECISIONS #30: "Kunci-kelas-per-level DITOLAK"). Points rank people; they
// never ration learning. If a future ticket asks for it, that ticket is wrong.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Points needed to REACH each level, verified against help.skool.com/article/31.
 * Index i holds the threshold for level i+1, so LEVEL_THRESHOLDS[0] === 0 is
 * level 1 (every member starts there, including one who never scored).
 */
export const LEVEL_THRESHOLDS = [0, 5, 20, 65, 155, 515, 2015, 8015, 33015] as const;

/** Highest reachable level (9). */
export const MAX_LEVEL = LEVEL_THRESHOLDS.length;

export type LevelInfo = {
  level: number;
  /** Threshold that opened the current level (for a progress bar's floor). */
  levelAt: number;
  /** Points that open the next level; null at MAX_LEVEL. */
  nextLevelAt: number | null;
  /** Points still to earn ("N poin lagi"); null at MAX_LEVEL. */
  pointsToNext: number | null;
};

/**
 * Level for a points total. Clamped at both ends: anything below the first
 * threshold (including a negative, which should never be stored) is level 1,
 * and 33015+ is level 9.
 */
export function deriveLevel(points: number): number {
  let level = 1;
  for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
    if (points < LEVEL_THRESHOLDS[i]) break;
    level = i + 1;
  }
  return level;
}

/** deriveLevel plus the two numbers the "N poin lagi ke level X" copy needs. */
export function deriveLevelInfo(points: number): LevelInfo {
  const level = deriveLevel(points);
  const nextLevelAt = level < MAX_LEVEL ? LEVEL_THRESHOLDS[level] : null;
  return {
    level,
    levelAt: LEVEL_THRESHOLDS[level - 1],
    nextLevelAt,
    pointsToNext: nextLevelAt === null ? null : Math.max(0, nextLevelAt - points),
  };
}
