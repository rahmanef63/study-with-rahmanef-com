// Level chip — the one place a level number turns into a colour.
//
// The ramp is the --chart-* sprite palette (magenta/cyan/gold/green/violet), so
// levels read as categories on a 16-bit tile set rather than as a heat scale.
// Class strings are written out in full because Tailwind scans source text: a
// template-built `text-chart-${n}` would never be emitted.
//
// MAX_LEVEL comes from the pure derive module the query itself uses — the UI and
// the backend can never disagree about how many levels exist.
import { MAX_LEVEL } from "@convex/features/leaderboard/derive";
import { cn } from "@/lib/utils";

const LEVEL_TONE = [
  "border-chart-2/50 bg-chart-2/15 text-chart-2",
  "border-chart-4/50 bg-chart-4/15 text-chart-4",
  "border-chart-3/50 bg-chart-3/15 text-chart-3",
  "border-chart-1/50 bg-chart-1/15 text-chart-1",
  "border-chart-5/50 bg-chart-5/15 text-chart-5",
] as const;

/** Tone for a level, clamped to the real 1..MAX_LEVEL range then cycled. */
export function levelTone(level: number): string {
  const clamped = Math.min(Math.max(Math.trunc(level), 1), MAX_LEVEL);
  return LEVEL_TONE[(clamped - 1) % LEVEL_TONE.length];
}

export function LevelChip({ level, className }: { level: number; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center border px-1.5 py-1 font-display text-[0.5rem] uppercase leading-none tracking-wider",
        levelTone(level),
        className
      )}
    >
      Lv {level}
    </span>
  );
}
