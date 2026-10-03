"use client";

// BadgeWall — presentational grid of earned-course badges (R11). Props-driven,
// no data fetching and no hardcoded copy/URLs, so it is portable and unit-safe.
// Container-first: two columns on the narrowest window, layering up with @sm/@lg.
import Link from "next/link";
import { CalendarCheck, Users } from "lucide-react";
import { Empty, EmptyArt, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { ART_SIZE } from "@/lib/art";
import { badgeArtForCourse } from "../lib/badge-art";
import { SectionHeader, StatTile, Badge as CountBadge } from "@/components/mockup-kit";
import { formatEarnedDate } from "../lib/earned-date";
import { cn } from "@/lib/utils";
import { DEFAULT_PUBLIC_PROFILE_LABELS } from "../config/public-labels";
import type { Badge, PublicProfileLabels } from "../types";

export type BadgeWallProps = {
  badges: Badge[];
  /**
   * Builds the public certificate href for one badge (STATUS #24) — e.g.
   * `(id) => `/sertifikat/${id}``. Omitted → tiles stay non-interactive
   * (portability: the slice never hardcodes the host's route shape).
   */
  certificateHref?: (completionId: Badge["completionId"]) => string;
  labels?: Partial<PublicProfileLabels>;
  className?: string;
};

export function BadgeWall({ badges, certificateHref, labels, className }: BadgeWallProps) {
  const copy = { ...DEFAULT_PUBLIC_PROFILE_LABELS, ...labels };
  const hasBadges = badges.length > 0;
  // Real derived stats (no fake data) — distinct communities + most-recent badge.
  const communityCount = new Set(badges.map((b) => b.tenantSlug)).size;
  const latest = hasBadges ? badges.reduce((a, b) => (b.earnedAt > a.earnedAt ? b : a)) : null;

  return (
    <section className={cn("@container flex flex-col gap-5", className)} aria-label={copy.badgesTitle}>
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
            <EmptyArt src="/learning/badge/achievement.webp" />
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
                value={formatEarnedDate(latest.earnedAt, "short")}
                hint={latest.courseTitle}
              />
            ) : null}
          </div>

          {/* Use this section's width rather than the surrounding app shell. */}
          <ul className="grid grid-cols-1 gap-3 @md:grid-cols-2 @3xl:grid-cols-3">
            {badges.map((badge) => {
              const tile = (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element -- committed
                      badge sprite; next/image would re-encode a small WebP. */}
                  <img
                    src={badgeArtForCourse(badge.courseSlug)}
                    alt=""
                    width={ART_SIZE.tile}
                    height={ART_SIZE.tile}
                    loading="lazy"
                    decoding="async"
                    className="pixelated size-11 object-contain"
                  />
                  <span className="line-clamp-2 text-sm font-medium leading-snug text-foreground">
                    {badge.courseTitle}
                  </span>
                  <span className="max-w-full truncate text-xs text-muted-foreground">
                    @{badge.tenantSlug}
                  </span>
                  <span className="text-[0.7rem] leading-tight text-muted-foreground">
                    {copy.badgeEarnedPrefix} {formatEarnedDate(badge.earnedAt, "short")}
                  </span>
                </>
              );
              const tileClass =
                "group flex flex-col items-center gap-2.5 rounded-[var(--radius)] border border-border bg-card p-4 text-center transition-colors hover:border-primary/30 @sm:p-5";
              return (
                <li key={badge.completionId}>
                  {certificateHref ? (
                    // Badge tile deep-links to its public certificate (STATUS #24).
                    <Link href={certificateHref(badge.completionId)} className={tileClass}>
                      {tile}
                    </Link>
                  ) : (
                    <div className={tileClass}>{tile}</div>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}
