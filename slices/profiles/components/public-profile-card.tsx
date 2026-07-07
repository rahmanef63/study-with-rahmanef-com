"use client";

// Presentational public-profile card (avatar, name, @handle, bio, share/ID copy
// button) with the BadgeWall below. Pure props — no data fetching, no hardcoded
// copy/URLs — so it stays portable and unit-testable. The container
// (PublicProfileView) fetches and feeds it.
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Hero } from "@/components/mockup-kit";
import { cn } from "@/lib/utils";
import { DEFAULT_PUBLIC_PROFILE_LABELS } from "../config/public-labels";
import type { Badge, PublicProfile, PublicProfileLabels } from "../types";
import { BadgeWall } from "./badge-wall";
import { ProfileAvatar } from "./profile-avatar";

export type PublicProfileCardProps = {
  profile: PublicProfile;
  badges: Badge[];
  /** Text the copy button writes — a full share URL when the host supplies one, else the handle. */
  shareValue: string;
  /** When set (viewer owns this profile), an "Edit profil" link renders next to the copy button. */
  editHref?: string;
  labels?: Partial<PublicProfileLabels>;
  className?: string;
};

export function PublicProfileCard({
  profile,
  badges,
  shareValue,
  editHref,
  labels,
  className,
}: PublicProfileCardProps) {
  const copy = { ...DEFAULT_PUBLIC_PROFILE_LABELS, ...labels };
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareValue);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard unavailable (insecure context / denied permission) — best effort.
    }
  };

  return (
    <div className={cn("mx-auto flex w-full max-w-2xl flex-col gap-10 @sm:gap-12", className)}>
      <Hero
        eyebrow="Profil publik"
        title={
          <span className="flex flex-col gap-3 @sm:flex-row @sm:items-center @sm:gap-5">
            {/* decorative: the visible name text right beside it already names the heading */}
            <span aria-hidden="true" className="shrink-0">
              <ProfileAvatar
                name={profile.displayName}
                avatarUrl={profile.avatarUrl}
                size={96}
                className="shadow-sm"
              />
            </span>
            <span className="flex min-w-0 flex-col gap-1">
              <span className="break-words leading-tight">{profile.displayName}</span>
              <span className="text-sm font-normal text-muted-foreground">@{profile.username}</span>
            </span>
          </span>
        }
      >
        <div className="space-y-4">
          {/* real bio stays full-contrast; only the empty placeholder is muted */}
          {profile.bio ? (
            <p className="max-w-xl text-pretty leading-relaxed text-foreground">{profile.bio}</p>
          ) : (
            <p className="max-w-xl text-sm text-muted-foreground">{copy.bioEmpty}</p>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <div aria-live="polite">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="min-h-11 px-4"
                aria-label={copy.copyLabel}
                onClick={() => void onCopy()}
              >
                {copied ? copy.copiedLabel : copy.copyLabel}
              </Button>
            </div>
            {editHref ? (
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="min-h-11 px-4 text-muted-foreground"
              >
                <Link href={editHref}>{copy.editLabel}</Link>
              </Button>
            ) : null}
          </div>
        </div>
      </Hero>

      <BadgeWall badges={badges} labels={labels} />
    </div>
  );
}
