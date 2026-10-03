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
  /** Host already renders the profile title, bio and share action. */
  hasServerHeading?: boolean;
  /** When set (viewer owns this profile), an "Edit profil" link renders next to the copy button. */
  editHref?: string;
  /** Builds the certificate href per badge (STATUS #24) — forwarded to BadgeWall. */
  certificateHref?: (completionId: Badge["completionId"]) => string;
  labels?: Partial<PublicProfileLabels>;
  className?: string;
};

export function PublicProfileCard({
  profile,
  badges,
  shareValue,
  hasServerHeading = false,
  editHref,
  certificateHref,
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
    <div className={cn("flex w-full flex-col gap-10 @sm:gap-12", className)}>
      <div className="flex flex-wrap items-center gap-4">
        <ProfileAvatar name={profile.displayName} avatarUrl={profile.avatarUrl} size={96} />
        {!hasServerHeading || editHref ? <div className="min-w-0 flex-1 space-y-4">
          {!hasServerHeading ? <div className="space-y-2">
            <h1 className="title-content text-2xl [overflow-wrap:anywhere]">{profile.displayName}</h1>
            <p className="text-muted-foreground">@{profile.username}</p>
            <p className={profile.bio ? "max-w-xl text-pretty text-foreground" : "text-sm text-muted-foreground"}>
              {profile.bio || copy.bioEmpty}
            </p>
          </div> : null}
          <div className="flex flex-wrap items-center gap-2">
            {!hasServerHeading ? <div aria-live="polite">
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
            </div> : null}
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
        </div> : null}
      </div>

      <BadgeWall badges={badges} certificateHref={certificateHref} labels={labels} />
    </div>
  );
}
