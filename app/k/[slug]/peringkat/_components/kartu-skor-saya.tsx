// The caller's own standing — the "1UP" panel above the board, and the one
// primary thing on the Peringkat screen.
//
// Thresholds come from the pure derive module the query itself uses, so the
// progress bar's floor can never drift from the level the server reported.
// getMyRank already hands us nextLevelAt/pointsToNext; only the floor has to be
// looked up here.
import { LEVEL_THRESHOLDS, MAX_LEVEL } from "@convex/features/leaderboard/derive";
import { RANK_SCAN_CAP } from "@convex/features/leaderboard/constants";
import type { MyRank } from "@convex/features/leaderboard/queries";
import { Skeleton } from "@/components/ui/skeleton";
import { LevelChip } from "./level-chip";

const poin = new Intl.NumberFormat("id-ID");

export function KartuSkorSaya({ mine }: { mine: MyRank | undefined }) {
  if (mine === undefined) {
    return <Skeleton className="h-28 w-full" aria-label="Memuat skor kamu" />;
  }

  const floor = LEVEL_THRESHOLDS[mine.level - 1] ?? 0;
  const span = mine.nextLevelAt === null ? 0 : mine.nextLevelAt - floor;
  // Max level has no "next", so the bar reads full instead of dividing by zero.
  const persen = span <= 0 ? 100 : Math.min(100, Math.round(((mine.points - floor) / span) * 100));
  const maxed = mine.nextLevelAt === null || mine.pointsToNext === null;

  return (
    <div className="border border-primary bg-card p-3.5 shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="eyebrow">Skor kamu</span>
          {/* "poin terkumpul" deleted: the unit is already on every row of the
              board below and in the level line right under this number. */}
          <p className="marquee-text text-base tabular-nums @sm:text-lg">
            {poin.format(mine.points)}
          </p>
        </div>
        <div className="min-w-0 shrink-0 text-right">
          <span className="eyebrow">Peringkat</span>
          {/* rank is null past the scan cap — never render the word "null".
              At 0 poin the derived rank would read "#01" on an empty board,
              which contradicts it: a never-scored member is not on the board. */}
          {mine.points === 0 ? (
            <p className="text-xs text-muted-foreground">Belum masuk papan</p>
          ) : mine.rank === null ? (
            <p className="text-xs text-muted-foreground">
              Di luar {poin.format(RANK_SCAN_CAP)} besar
            </p>
          ) : (
            <p className="font-display text-sm tabular-nums">
              #{String(mine.rank).padStart(2, "0")}
            </p>
          )}
        </div>
      </div>

      <div className="mt-3 space-y-1.5">
        <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
          <LevelChip level={mine.level} />
          <span className="text-xs text-muted-foreground">
            {maxed
              ? `Level ${MAX_LEVEL} — level tertinggi.`
              : `${poin.format(mine.pointsToNext ?? 0)} poin lagi ke level ${mine.level + 1}`}
          </span>
        </div>
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={persen}
          aria-label={
            maxed ? `Level ${MAX_LEVEL}, sudah maksimal` : `Kemajuan ke level ${mine.level + 1}`
          }
          className="h-2.5 w-full border border-border bg-muted"
        >
          {/* Stepped block fill, not a gradient — it is a power bar, not a meter. */}
          <div className="h-full bg-primary" style={{ width: `${persen}%` }} />
        </div>
      </div>
    </div>
  );
}
