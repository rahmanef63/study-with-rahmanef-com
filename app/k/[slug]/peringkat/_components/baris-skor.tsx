// One HI-SCORE row inside the inset grouped list: rank, sprite, player, level,
// points. The whole row is the link to the player's public profile (identity is
// the only thing on it that leads anywhere).
//
// It used to be a framed card of its own — 2px border, 3px hard shadow, 8px
// gap, per player. Ten players meant ten boxes and the ranking, which is the
// entire point of a leaderboard, had to be read off ten separate objects
// instead of one column. Rank #1 and "you" are now marked INSIDE the list
// (gold numerals, a tinted row) the way a scoreboard marks them.
import Link from "next/link";
import type { LeaderboardEntry } from "@convex/features/leaderboard/queries";
import { ProfileAvatar } from "@/features/profiles";
import { communityHref } from "@/lib/community";
import { cn } from "@/lib/utils";
import { INSET_ROW } from "../../_components/inset-list";
import { LevelChip } from "./level-chip";

const poin = new Intl.NumberFormat("id-ID");

export function BarisSkor({ entry, isMe }: { entry: LeaderboardEntry; isMe: boolean }) {
  const juara = entry.rank === 1;
  return (
    <li className={isMe ? "bg-accent/10" : undefined}>
      <Link
        href={communityHref.profile(entry.username)}
        aria-label={`Peringkat ${entry.rank}: ${entry.displayName}, ${entry.points} poin, level ${entry.level}`}
        className={cn(
          INSET_ROW,
          "hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-none"
        )}
      >
        {/* Zero-padded so the column is a fixed-width score strip, not ragged. */}
        <span
          aria-hidden
          className={cn(
            "w-6 shrink-0 font-display text-caption tabular-nums",
            juara ? "marquee-text" : "text-muted-foreground"
          )}
        >
          {String(entry.rank).padStart(2, "0")}
        </span>

        <ProfileAvatar
          name={entry.displayName}
          avatarUrl={entry.avatarUrl}
          size={32}
          className="pixelated"
        />

        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <span className="truncate text-sm font-medium">{entry.displayName}</span>
            {/* Not `.eyebrow`: it hardcodes 0.75rem, and a Press Start "KAMU"
                that size shouts louder than the player's own name. */}
            {isMe ? (
              <span className="shrink-0 font-display text-caption uppercase tracking-wider text-accent">
                kamu
              </span>
            ) : null}
          </span>
          <span className="flex items-center gap-2">
            <span className="truncate text-xs text-muted-foreground">@{entry.username}</span>
            <LevelChip level={entry.level} />
          </span>
        </span>

        <span aria-hidden className="shrink-0 text-right">
          <span
            className={cn(
              "block font-display text-caption tabular-nums",
              juara ? "text-primary" : "text-foreground"
            )}
          >
            {poin.format(entry.points)}
          </span>
          <span className="mt-0.5 block text-[0.625rem] leading-none text-muted-foreground">
            poin
          </span>
        </span>
      </Link>
    </li>
  );
}
