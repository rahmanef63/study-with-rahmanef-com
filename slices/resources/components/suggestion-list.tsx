"use client";
// resources slice — suggestion grid (loading / empty / list). Optional
// `renderActions` injects instructor triage controls per card so the box view
// stays lean and the card stays presentational.
import type { ReactNode } from "react";
import { Lightbulb } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { ResourcesCopy } from "../config/copy";
import type { SuggestionCard as SuggestionCardData } from "../types";
import { BoardEmptyState } from "./board-empty-state";
import { SuggestionCard } from "./suggestion-card";

export type SuggestionListProps<S extends SuggestionCardData = SuggestionCardData> = {
  items: S[] | undefined;
  emptyLabel: string;
  copy: ResourcesCopy;
  /** Per-card upvote control (#18) — generic so vote-enriched cards type through. */
  renderVote?: (suggestion: S) => ReactNode;
  renderActions?: (suggestion: S) => ReactNode;
};

export function SuggestionList<S extends SuggestionCardData>({
  items,
  emptyLabel,
  copy,
  renderVote,
  renderActions,
}: SuggestionListProps<S>) {
  if (items === undefined) {
    return (
      <div className="grid gap-4 @sm:grid-cols-2 @3xl:grid-cols-3 @6xl:grid-cols-4">
        <Skeleton className="h-32" />
        <Skeleton className="hidden h-32 @sm:block" />
        <Skeleton className="hidden h-32 @3xl:block" />
        <Skeleton className="hidden h-32 @6xl:block" />
      </div>
    );
  }
  if (items.length === 0) {
    return (
      <BoardEmptyState
        icon={Lightbulb}
        message={emptyLabel}
        cta={{ label: copy.submitSuggestionTitle, href: "#usulkan-topik" }}
      />
    );
  }
  return (
    <div className="grid gap-4 @sm:grid-cols-2 @3xl:grid-cols-3 @6xl:grid-cols-4">
      {items.map((s) => (
        <SuggestionCard
          key={s._id}
          suggestion={s}
          copy={copy}
          vote={renderVote?.(s)}
          actions={renderActions?.(s)}
        />
      ))}
    </div>
  );
}
