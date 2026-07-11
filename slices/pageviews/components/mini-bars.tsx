// pageviews slice — presentational per-day volume bars. Pure/props-driven; CSS
// bars only (no chart lib), same accessible spirit as slices/analytics. Each bar
// carries a native title so hovering shows the day + count.
import { cn } from "@/lib/utils";

export type MiniBarsProps = {
  values: number[];
  /** Same length as values — one label (e.g. ISO day) per bar. */
  labels: string[];
  className?: string;
};

export function MiniBars({ values, labels, className }: MiniBarsProps) {
  const max = Math.max(1, ...values);
  const total = values.reduce((n, v) => n + v, 0);
  return (
    <div
      className={cn("flex h-24 items-end gap-1", className)}
      role="img"
      aria-label={`Volume harian, total ${total.toLocaleString("id-ID")} kunjungan`}
    >
      {values.map((v, i) => (
        <div
          key={`${labels[i] ?? i}`}
          className="flex min-w-0 flex-1 items-end self-stretch"
          title={`${labels[i] ?? ""}: ${v.toLocaleString("id-ID")}`}
        >
          <div
            className="w-full rounded-t-sm bg-primary/80 transition-all"
            style={{ height: `${Math.max(2, (v / max) * 100)}%` }}
          />
        </div>
      ))}
    </div>
  );
}
