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
    <section className={cn("flex flex-col gap-4", className)} aria-label={copy.badgesTitle}>
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold text-foreground">{copy.badgesTitle}</h2>
        {badges.length > 0 ? (
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">
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
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {badges.map((badge) => (
            <li
              key={`${badge.tenantSlug}/${badge.courseSlug}`}
              className="flex items-start gap-3 rounded-lg border border-border bg-card p-4"
            >
              <span
                aria-hidden="true"
                className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
              >
                <Award className="size-5" />
              </span>
              <div className="flex min-w-0 flex-col gap-1">
                <span className="font-medium text-foreground">{badge.courseTitle}</span>
                <span className="truncate text-sm text-muted-foreground">@{badge.tenantSlug}</span>
                <span className="mt-1 text-xs text-muted-foreground">
                  {copy.badgeEarnedPrefix} {formatEarned(badge.earnedAt)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
