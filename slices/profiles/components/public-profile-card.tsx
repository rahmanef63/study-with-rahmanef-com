"use client";

// Presentational public-profile card (avatar, name, @handle, bio, share/ID copy
// button) with the BadgeWall below. Pure props — no data fetching, no hardcoded
// copy/URLs — so it stays portable and unit-testable. The container
// (PublicProfileView) fetches and feeds it.
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
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
    <div className={cn("mx-auto flex w-full max-w-2xl flex-col gap-10 sm:gap-14", className)}>
      <header className="flex flex-col gap-6">
        <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:items-end sm:gap-6 sm:text-left">
          <ProfileAvatar
            name={profile.displayName}
            avatarUrl={profile.avatarUrl}
            size={112}
            className="shrink-0 shadow-sm"
          />
          <div className="flex min-w-0 flex-col items-center gap-1 sm:items-start">
            <span className="eyebrow">Profil publik</span>
            <h1 className="text-pretty text-3xl leading-tight sm:text-4xl">{profile.displayName}</h1>
            <p className="text-sm text-muted-foreground">@{profile.username}</p>
          </div>
        </div>

        {profile.bio ? (
          <p className="max-w-prose text-pretty text-base leading-relaxed text-foreground">
            {profile.bio}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">{copy.bioEmpty}</p>
        )}

        <div className="flex flex-wrap items-center gap-2 border-t pt-6">
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
      </header>

      <BadgeWall badges={badges} labels={labels} />
    </div>
  );
}
