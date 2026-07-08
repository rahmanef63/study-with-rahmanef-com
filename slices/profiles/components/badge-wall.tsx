"use client";

// BadgeWall — presentational grid of earned-course badges (R11). Props-driven,
// no data fetching and no hardcoded copy/URLs, so it is portable and unit-safe.
// Container-first: two columns on the narrowest window, layering up with @sm/@lg.
import { Award, CalendarCheck, Users } from "lucide-react";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { SectionHeader, StatTile, Badge as CountBadge } from "@/components/mockup-kit";
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
  const hasBadges = badges.length > 0;
  // Real derived stats (no fake data) — distinct communities + most-recent badge.
  const communityCount = new Set(badges.map((b) => b.tenantSlug)).size;
  const latest = hasBadges ? badges.reduce((a, b) => (b.earnedAt > a.earnedAt ? b : a)) : null;

  return (
    <section className={cn("flex flex-col gap-5", className)} aria-label={copy.badgesTitle}>
      <SectionHeader
        eyebrow="Koleksi"
        title={copy.badgesTitle}
        actions={
          hasBadges ? (
            <CountBadge tone="accent">{badges.length} lencana</CountBadge>
          ) : undefined
        }
      />

      {!hasBadges ? (
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
        <>
          {/* At-a-glance summary — mockup StatTile vocabulary, single column when
              the window is narrow so nothing overflows at ~340px. */}
          <div className="grid grid-cols-1 gap-3 @sm:grid-cols-2">
            <StatTile
              icon={<Users className="size-5" />}
              label="Komunitas"
              value={communityCount}
            />
            {latest ? (
              <StatTile
                icon={<CalendarCheck className="size-5" />}
                label="Terbaru"
                value={formatEarned(latest.earnedAt)}
                hint={latest.courseTitle}
              />
            ) : null}
          </div>

          {/* Polished card grid — bordered tiles with a hover lift, 2-up on the
              narrowest window, more columns as the window widens. */}
          <ul className="grid grid-cols-2 gap-3 @sm:grid-cols-3 @lg:grid-cols-4 @2xl:grid-cols-5 @4xl:grid-cols-6">
            {badges.map((badge) => (
              <li
                key={`${badge.tenantSlug}/${badge.courseSlug}`}
                className="group flex flex-col items-center gap-2.5 rounded-[var(--radius-win)] border border-border bg-card p-4 text-center transition-colors hover:border-primary/30 @sm:p-5"
              >
                <span
                  aria-hidden="true"
                  className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary/15"
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
        </>
      )}
    </section>
  );
}
