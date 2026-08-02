"use client";
// search slice — friendly empty state (props-driven copy; theme tokens only).
import { SearchX } from "lucide-react";

export type SearchEmptyStateProps = {
  title: string;
  hint: string;
};

export function SearchEmptyState({ title, hint }: SearchEmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-md border border-dashed border-border px-6 py-10 text-center">
      <SearchX aria-hidden className="size-6 text-muted-foreground" />
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}
