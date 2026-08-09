// One HI-SCORE row: rank, sprite, player, level, points.
//
// The whole row is the link to the player's public profile (identity is the only
// thing on it that leads anywhere), so the grid lives on the <a> itself. `<a>` is
// transparent content inside an `<li>`, so the div children below are valid.
import Link from "next/link";
import type { LeaderboardEntry } from "@convex/features/leaderboard/queries";
import { ProfileAvatar } from "@/features/profiles";
import { communityHref } from "@/lib/community";
import { cn } from "@/lib/utils";
import { LevelChip } from "./level-chip";

const poin = new Intl.NumberFormat("id-ID");

/** Shared by the row and the column-label strip above it so they stay aligned. */
export const SKOR_GRID = "grid grid-cols-[2.25rem_1fr_auto] items-center gap-3 @sm:grid-cols-[3rem_1fr_auto]";

export function BarisSkor({ entry, isMe }: { entry: LeaderboardEntry; isMe: boolean }) {
  const juara = entry.rank === 1;
  return (
    <li>
      <Link
        href={communityHref.profile(entry.username)}
        aria-label={`Peringkat ${entry.rank}: ${entry.displayName}, ${entry.points} poin, level ${entry.level}`}
        className={cn(
          SKOR_GRID,
          "border-2 bg-card px-3 py-2.5 shadow-[3px_3px_0_0_var(--pixel-shadow)] transition-colors",
          "hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          juara ? "border-primary" : isMe ? "border-accent" : "border-border"
        )}
      >
        {/* Zero-padded so the column is a fixed-width score strip, not ragged. */}
        <span
          aria-hidden
          className={cn(
            "font-display text-xs tabular-nums",
            juara ? "marquee-text" : "text-muted-foreground"
          )}
        >
          {String(entry.rank).padStart(2, "0")}
        </span>

        <div className="flex min-w-0 items-center gap-2.5">
          <ProfileAvatar
            name={entry.displayName}
            avatarUrl={entry.avatarUrl}
            size={32}
            className="pixelated"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-sm font-medium">{entry.displayName}</span>
              {isMe ? (
                <span className="eyebrow shrink-0 text-[0.5rem] text-accent">kamu</span>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <span className="truncate text-xs text-muted-foreground">@{entry.username}</span>
              <LevelChip level={entry.level} />
            </div>
          </div>
        </div>

        <div aria-hidden className="text-right">
          <span
            className={cn(
              "block font-display text-xs tabular-nums",
              juara ? "text-primary" : "text-foreground"
            )}
          >
            {poin.format(entry.points)}
          </span>
          <span className="block text-[10px] uppercase tracking-widest text-muted-foreground">
            poin
          </span>
        </div>
      </Link>
    </li>
  );
}
