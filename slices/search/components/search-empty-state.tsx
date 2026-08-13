"use client";
// search slice — friendly empty state (props-driven copy; theme tokens only).
import { ART_SIZE } from "@/lib/art";

export type SearchEmptyStateProps = {
  title: string;
  hint: string;
  /** Overridable by the host; the default is the sprite this app ships. */
  art?: string;
};

export function SearchEmptyState({ title, hint, art = "/ui/empty/search.webp" }: SearchEmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-md border border-dashed border-border px-6 py-10 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element -- committed static asset. */}
      <img
        src={art}
        alt=""
        width={ART_SIZE.media}
        height={ART_SIZE.media}
        loading="lazy"
        decoding="async"
        className="pixelated size-24 object-contain"
      />
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}
