"use client";
// Profil — a member's public profile + badge wall inside an OS window. With a
// `{ username }` payload it shows that member; with no payload it shows the
// signed-in user's own profile (logged-out → an empty state that opens the
// Masuk app). Reuses the profiles slice's PublicProfileView (public card +
// badge wall) — no reimplementation. Fetches client-side via useQuery like
// Beranda (root layout already mounts Convex).
import type { ReactNode } from "react";
import { LogIn, UserRound } from "lucide-react";
import { useConvexAuth, useQuery } from "convex/react";
import { type AppProps } from "@/features/appshell";
import { PublicProfileView, type CurrentProfile } from "@/features/profiles";
import { openApp, seg } from "./_nav";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@convex/_generated/api";

// The slice never hardcodes an origin; the host passes its own absolute URL so
// the reused card's copy button shares a real link (mirrors /u/[username]).
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://study-with.rahmanef.com";

function Frame({ children }: { children: ReactNode }) {
  return <div className="mx-auto w-full max-w-2xl space-y-8 p-6 sm:p-8">{children}</div>;
}

/** Foreign profile: a `username` payload → the reused anonymous public view. */
function MemberProfil({ username }: { username: string }) {
  return (
    <Frame>
      <header className="min-w-0 space-y-1">
        <span className="eyebrow">Profil anggota</span>
        <p className="truncate text-sm text-muted-foreground">@{username}</p>
      </header>
      <PublicProfileView username={username} shareUrl={`${SITE_URL}/profil/${username}`} />
    </Frame>
  );
}

/** Own profile: resolve the signed-in user's handle, then reuse the same view. */
function OwnProfil() {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  // Skip the query while signed out so we never hit the NOT_AUTHENTICATED throw
  // (requireUser stays the first server line; the skip is pure UX).
  const profile = useQuery(
    api.features.profiles.queries.getCurrentProfile,
    isAuthenticated ? {} : "skip",
  ) as CurrentProfile | null | undefined;

  // Auth state or the first read still resolving → skeletons (like Beranda).
  if (authLoading || (isAuthenticated && profile === undefined)) {
    return (
      <Frame>
        <OwnSkeleton />
      </Frame>
    );
  }

  // Signed out → prompt to open the Masuk app.
  if (!isAuthenticated) {
    return (
      <Frame>
        <Empty className="border bg-muted/30">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <UserRound aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>Masuk untuk melihat profilmu</EmptyTitle>
            <EmptyDescription className="text-pretty">
              Profil publik dan koleksi badge kamu muncul di sini setelah kamu masuk.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button
              type="button"
              className="min-h-11 px-5"
              onClick={() => openApp("masuk", "Masuk")}
            >
              <LogIn aria-hidden="true" /> Masuk
            </Button>
          </EmptyContent>
        </Empty>
      </Frame>
    );
  }

  // Authenticated but no profile row yet → nudge to Pengaturan to create one.
  if (!profile) {
    return (
      <Frame>
        <Empty className="border bg-muted/30">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <UserRound aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>Lengkapi profilmu dulu</EmptyTitle>
            <EmptyDescription className="text-pretty">
              Pilih username dan nama tampilan supaya profilmu bisa dibagikan.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button
              type="button"
              className="min-h-11 px-5"
              onClick={() => openApp("pengaturan", "Pengaturan")}
            >
              Buka Pengaturan
            </Button>
          </EmptyContent>
        </Empty>
      </Frame>
    );
  }

  // Own profile resolved → the reused public view + a Pengaturan action.
  return (
    <Frame>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <span className="eyebrow">Profil kamu</span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="min-h-11 px-4"
          onClick={() => openApp("pengaturan", "Pengaturan")}
        >
          Pengaturan
        </Button>
      </header>
      <PublicProfileView
        username={profile.username}
        shareUrl={`${SITE_URL}/profil/${profile.username}`}
      />
    </Frame>
  );
}

function OwnSkeleton() {
  return (
    <div className="flex flex-col gap-8" aria-busy="true">
      <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-end sm:gap-6">
        <Skeleton className="size-28 shrink-0 rounded-full" />
        <div className="flex w-full min-w-0 flex-col items-center gap-2 sm:items-start">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-9 w-52 max-w-full" />
          <Skeleton className="h-4 w-28" />
        </div>
      </div>
      <Skeleton className="h-4 w-full max-w-md" />
      <div className="grid grid-cols-2 gap-3 @sm:grid-cols-3 @lg:grid-cols-4">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
    </div>
  );
}

export default function ProfilApp(props: AppProps) {
  // Deep-link path: /profil/<username> (empty = the signed-in user's own profile)
  const [username] = seg(props.payload);
  // Branch on which container mounts — each owns its own hooks, so no hook is
  // called conditionally.
  return username ? <MemberProfil username={username} /> : <OwnProfil />;
}
