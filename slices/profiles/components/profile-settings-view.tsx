"use client";

// Container the integrator mounts at /pengaturan/profil (SLICES.md). Wires
// slice hooks to the presentational form; also runs the ensure-on-first-login
// bootstrap when a signed-in user has no profile row yet (PRD R1).
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DEFAULT_PROFILE_LABELS } from "../config/labels";
import { useCurrentProfile } from "../hooks/use-current-profile";
import {
  useCheckUsername,
  useEnsureProfileOnFirstLogin,
  useUpdateProfile,
} from "../hooks/use-profile-mutations";
import type { ProfileLabels } from "../types";
import { ProfileSettingsForm } from "./profile-settings-form";

export type ProfileSettingsViewProps = { labels?: Partial<ProfileLabels> };

function SettingsSkeleton({ hint }: { hint?: string }) {
  return (
    <Card aria-busy="true">
      <CardHeader>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-72" />
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {hint ? <p className="text-sm text-muted-foreground">{hint}</p> : null}
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-9 w-full" />
      </CardContent>
    </Card>
  );
}

export function ProfileSettingsView({ labels }: ProfileSettingsViewProps) {
  const copy = { ...DEFAULT_PROFILE_LABELS, ...labels };
  const { profile, isLoading, isAuthenticated } = useCurrentProfile();
  // First login: row missing → create it once; the reactive query then
  // swaps the skeleton for the form without a manual refetch.
  useEnsureProfileOnFirstLogin(isAuthenticated && !isLoading && profile === null);
  const { save, isSaving } = useUpdateProfile(labels);
  const checkUsername = useCheckUsername();

  if (isLoading) return <SettingsSkeleton />;

  if (!isAuthenticated) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{copy.title}</CardTitle>
          <CardDescription>{copy.signInPrompt}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/masuk">{copy.signInAction}</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (profile === null) return <SettingsSkeleton hint={copy.preparingProfile} />;

  return (
    <ProfileSettingsForm
      key={profile._id}
      initial={{
        username: profile.username,
        displayName: profile.displayName,
        bio: profile.bio ?? "",
        avatarUrl: profile.avatarUrl ?? "",
      }}
      labels={labels}
      isSaving={isSaving}
      onSubmit={save}
      onCheckUsername={checkUsername}
    />
  );
}

export default ProfileSettingsView;
