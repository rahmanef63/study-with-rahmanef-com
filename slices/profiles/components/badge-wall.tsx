"use client";

// BadgeWall — presentational grid of earned-course badges (R11). Props-driven,
// no data fetching and no hardcoded copy/URLs, so it is portable and unit-safe.
// Mobile-first: one column on the smallest screens, layering up with sm:/lg:.
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
          <span className="text-sm text-muted-foreground">{badges.length}</span>
        ) : null}
      </div>

      {badges.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border bg-muted/40 p-6 text-center text-sm text-muted-foreground">
          {copy.badgesEmpty}
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {badges.map((badge) => (
            <li
              key={`${badge.tenantSlug}/${badge.courseSlug}`}
              className="flex flex-col gap-1 rounded-lg border border-border bg-card p-4"
            >
              <span className="font-medium text-foreground">{badge.courseTitle}</span>
              <span className="text-sm text-muted-foreground">@{badge.tenantSlug}</span>
              <span className="mt-1 text-xs text-muted-foreground">
                {copy.badgeEarnedPrefix} {formatEarned(badge.earnedAt)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
