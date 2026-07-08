"use client";

// Container the integrator mounts at /u/[username] (alpha wires the route).
// Fetches the anonymous etalase data, shows a skeleton while loading, renders
// the card when ready, and — via the boundary — a not-found/error fallback when
// the handle is unknown. Signed-out visitors are fully supported (no auth).
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { DEFAULT_PUBLIC_PROFILE_LABELS } from "../config/public-labels";
import { useCurrentProfile } from "../hooks/use-current-profile";
import { usePublicProfile } from "../hooks/use-public-profile";
import type { PublicProfileLabels } from "../types";
import { PublicProfileBoundary } from "./public-profile-boundary";
import { PublicProfileCard } from "./public-profile-card";

export type PublicProfileViewProps = {
  username: string;
  /**
   * Full shareable URL for the copy button. Omitted → the button copies
   * "@username" (portability: the slice never hardcodes an origin; the host
   * passes its own absolute URL when mounting the route).
   */
  shareUrl?: string;
  labels?: Partial<PublicProfileLabels>;
  className?: string;
};

export function PublicProfileView({ username, shareUrl, labels, className }: PublicProfileViewProps) {
  const copy = { ...DEFAULT_PUBLIC_PROFILE_LABELS, ...labels };
  return (
    <div className={cn("w-full", className)}>
      {/* key resets the boundary's latched error when the handle changes */}
      <PublicProfileBoundary
        key={username}
        renderFallback={({ notFound }) => <ProfileFallback copy={copy} notFound={notFound} />}
      >
        <PublicProfileContent username={username} shareUrl={shareUrl} labels={labels} />
      </PublicProfileBoundary>
    </div>
  );
}

type ContentProps = {
  username: string;
  shareUrl?: string;
  labels?: Partial<PublicProfileLabels>;
};

function PublicProfileContent({ username, shareUrl, labels }: ContentProps) {
  const { profile, badges, isLoading } = usePublicProfile(username);
  // Signed-out viewers skip the query (hook returns null) → isOwner stays false.
  const { profile: currentProfile } = useCurrentProfile();
  if (isLoading) return <ProfileSkeleton />;
  if (!profile) return null; // unreachable: an unknown handle throws → boundary
  const isOwner = currentProfile?.username === profile.username;
  return (
    <PublicProfileCard
      profile={profile}
      badges={badges}
      shareValue={shareUrl ?? `@${profile.username}`}
      editHref={isOwner ? "/pengaturan" : undefined}
      labels={labels}
    />
  );
}

function ProfileSkeleton() {
  return (
    <div className="flex w-full flex-col gap-10 @sm:gap-12" aria-busy="true">
      <div className="rounded-[var(--radius-win)] bg-gradient-to-b from-primary/[0.08] to-transparent to-90% px-5 py-8 @md:px-8 @md:py-10 dark:from-primary/[0.14]">
        <div className="flex flex-col gap-3 @sm:flex-row @sm:items-center @sm:gap-5">
          <Skeleton className="size-24 shrink-0 rounded-full" />
          <div className="flex w-full min-w-0 flex-col gap-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-9 w-52 max-w-full" />
            <Skeleton className="h-4 w-28" />
          </div>
        </div>
        <Skeleton className="mt-5 h-4 w-full max-w-md" />
        <Skeleton className="mt-5 h-11 w-40 rounded-md" />
      </div>
      <div className="grid grid-cols-2 gap-3 @sm:grid-cols-3 @lg:grid-cols-4 @2xl:grid-cols-5 @4xl:grid-cols-6">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
    </div>
  );
}

function ProfileFallback({ copy, notFound }: { copy: PublicProfileLabels; notFound: boolean }) {
  return (
    <Empty className="mx-auto max-w-2xl">
      <EmptyHeader>
        <EmptyTitle>{notFound ? copy.notFoundTitle : copy.errorTitle}</EmptyTitle>
        <EmptyDescription>{notFound ? copy.notFoundBody : copy.errorBody}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

export default PublicProfileView;
