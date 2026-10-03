// comments slice — warm empty state (pattern: resources board-empty-state).
// Presentational only.
import { ART_SIZE } from "@/lib/art";

export type CommentsEmptyStateProps = {
  title: string;
  hint: string;
};

export function CommentsEmptyState({ title, hint }: CommentsEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-[var(--radius)] border border-dashed border-border bg-muted/30 px-6 py-10 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element -- committed static asset. */}
      <img
        src="/ui/empty/diskusi.webp"
        alt=""
        width={ART_SIZE.media}
        height={ART_SIZE.media}
        loading="lazy"
        decoding="async"
        className="pixelated size-24 object-contain"
      />
      <div className="space-y-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="max-w-xs text-sm text-muted-foreground">{hint}</p>
      </div>
    </div>
  );
}
