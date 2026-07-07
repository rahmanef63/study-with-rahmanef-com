"use client";

// BadgeWall — presentational grid of earned-course badges (R11). Props-driven,
// no data fetching and no hardcoded copy/URLs, so it is portable and unit-safe.
// Mobile-first: one column on the smallest screens, layering up with sm:/lg:.
import { Award } from "lucide-react";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { cn } from "@/lib/utils";
import { DEFAULT_PUBLIC_PROFILE_LABELS } from "../config/public-labels";
import type { Badge, PublicProfileLabels } from "../types";

export type BadgeWallProps = {
  badges: Badge[];
  labels?: Partial<PublicProfileLabels>;
  className?: string;
};

/** Epoch ms → short Bahasa Indonesia date (e.g. "6 Jul 2026"). */
function formatEarned(earnedAt: number): string {
  return new Date(earnedAt).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function BadgeWall({ badges, labels, className }: BadgeWallProps) {
  const copy = { ...DEFAULT_PUBLIC_PROFILE_LABELS, ...labels };

  return (
    <section className={cn("flex flex-col gap-5", className)} aria-label={copy.badgesTitle}>
      <div className="flex items-end justify-between gap-3 border-b pb-3">
        <div className="flex flex-col gap-1">
          <span className="eyebrow">Koleksi</span>
          <h2 className="text-xl sm:text-2xl">{copy.badgesTitle}</h2>
        </div>
        {badges.length > 0 ? (
          <span className="mb-0.5 shrink-0 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">
            {badges.length}
          </span>
        ) : null}
      </div>

      {badges.length === 0 ? (
        // Warm, motivating empty state — heading is fixed presentational copy
        // (config/public-labels.ts stays the SSOT for the description below).
        <Empty className="border border-dashed border-border bg-muted/40">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Award aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>Kumpulkan badge pertamamu</EmptyTitle>
            <EmptyDescription>{copy.badgesEmpty}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        // Hairline-separated tile wall (matches the reference numbered grid):
        // gap-px cells on bg-border, each cell bg-card. Denser toward the top —
        // 2-up at 360px, more columns as the viewport grows.
        <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border bg-border sm:grid-cols-3 lg:grid-cols-4">
          {badges.map((badge) => (
            <li
              key={`${badge.tenantSlug}/${badge.courseSlug}`}
              className="flex flex-col items-center gap-2 bg-card p-4 text-center sm:p-5"
            >
              <span
                aria-hidden="true"
                className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
              >
                <Award className="size-5" />
              </span>
              <span className="line-clamp-2 text-sm font-medium leading-snug text-foreground">
                {badge.courseTitle}
              </span>
              <span className="max-w-full truncate text-xs text-muted-foreground">
                @{badge.tenantSlug}
              </span>
              <span className="text-[0.7rem] leading-tight text-muted-foreground">
                {copy.badgeEarnedPrefix} {formatEarned(badge.earnedAt)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
