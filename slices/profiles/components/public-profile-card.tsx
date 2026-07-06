"use client";

// Presentational public-profile card (avatar, name, @handle, bio, share/ID copy
// button) with the BadgeWall below. Pure props — no data fetching, no hardcoded
// copy/URLs — so it stays portable and unit-testable. The container
// (PublicProfileView) fetches and feeds it.
import { useState } from "react";
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
  labels?: Partial<PublicProfileLabels>;
  className?: string;
};

export function PublicProfileCard({
  profile,
  badges,
  shareValue,
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
    <div className={cn("mx-auto flex w-full max-w-2xl flex-col gap-8", className)}>
      <header className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card p-6 text-center sm:flex-row sm:items-start sm:gap-5 sm:text-left">
        <ProfileAvatar
          name={profile.displayName}
          avatarUrl={profile.avatarUrl}
          size={96}
          className="shrink-0"
        />
        <div className="flex min-w-0 flex-col items-center gap-2 sm:items-start">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{profile.displayName}</h1>
          <p className="text-sm text-muted-foreground">@{profile.username}</p>
          {profile.bio ? (
            <p className="max-w-prose text-sm leading-relaxed text-foreground">{profile.bio}</p>
          ) : (
            <p className="text-sm text-muted-foreground">{copy.bioEmpty}</p>
          )}
          <div className="mt-1" aria-live="polite">
            <Button
              type="button"
              variant="outline"
              size="sm"
              aria-label={copy.copyLabel}
              onClick={() => void onCopy()}
            >
              {copied ? copy.copiedLabel : copy.copyLabel}
            </Button>
          </div>
        </div>
      </header>

      <BadgeWall badges={badges} labels={labels} />
    </div>
  );
}
