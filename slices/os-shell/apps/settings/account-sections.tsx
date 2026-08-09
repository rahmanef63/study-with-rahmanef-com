"use client";

// Auth-gated Settings sections. Both REUSE existing views (AccountSettings from the
// os-shell account module, ProfileSettingsView from the profiles slice) and only
// gate them: a signed-out viewer gets an OS-native empty state that opens the
// "masuk" (sign-in) window instead of navigating to a route.
import { ProfileSettingsView, useCurrentProfile } from "@/features/profiles";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { CircleUser, LogIn, UserRound } from "lucide-react";
import { AccountSettings } from "../../account";
import { openApp } from "../_nav";

// Shared loading skeleton — preserves the profile section's original busy state and
// gives the account section the same feel while auth resolves.
function GateSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true">
      <Skeleton className="h-9 w-full" />
      <Skeleton className="h-9 w-full" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-9 w-40" />
    </div>
  );
}

// Akun — reuses AccountSettings (session + working sign-out). AccountSettings
// renders null when signed out, so this gate supplies a sign-in prompt to avoid a
// dead pane in the section nav.
export function AkunSection() {
  const { isAuthenticated, isLoading } = useCurrentProfile();

  if (isLoading) return <GateSkeleton />;

  if (!isAuthenticated) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <CircleUser />
          </EmptyMedia>
          <EmptyTitle className="font-serif">Belum masuk</EmptyTitle>
          <EmptyDescription className="text-pretty">
            Masuk untuk melihat sesi akun dan keluar kapan saja.
          </EmptyDescription>
        </EmptyHeader>
        <Button className="min-h-11" onClick={() => openApp("masuk", "Masuk")}>
          <LogIn className="size-4" />
          Masuk
        </Button>
      </Empty>
    );
  }

  return <AccountSettings />;
}

// Profil — reuses ProfileSettingsView for signed-in users; swaps its route-based
// sign-in card for an openApp("masuk") empty state so the settings window stays
// inside the desktop shell.
export function ProfilSection() {
  const { isAuthenticated, isLoading } = useCurrentProfile();

  if (isLoading) return <GateSkeleton />;

  if (!isAuthenticated) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <UserRound />
          </EmptyMedia>
          <EmptyTitle className="font-serif">Masuk dulu, yuk</EmptyTitle>
          <EmptyDescription className="text-pretty">
            Kamu perlu masuk untuk mengubah nama tampilan, username, dan bio.
          </EmptyDescription>
        </EmptyHeader>
        <Button className="min-h-11" onClick={() => openApp("masuk", "Masuk")}>
          <LogIn className="size-4" />
          Masuk
        </Button>
      </Empty>
    );
  }

  return <ProfileSettingsView />;
}
