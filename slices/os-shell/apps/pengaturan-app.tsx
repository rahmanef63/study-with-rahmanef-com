"use client";
// Pengaturan — the OS "settings" app. Two sections: Tampilan (theme mode +
// color preset) and Profil (edit-profile form). Renders inside an appshell
// window, so it reads auth/profile client-side via the profiles slice hooks
// (root layout already mounts Convex + the theme-preset provider).
//
// The profile form itself is REUSED from @/features/profiles — this app only
// gates it: a logged-out viewer gets an OS-native empty state that opens the
// "masuk" (sign-in) window instead of navigating to the /login route.
import { openWindow, type AppProps } from "@/features/appshell";
import { ThemePresetSwitcher } from "@/features/theme-presets";
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
import { LogIn, UserRound } from "lucide-react";

// Profil section — reuses the ProfileSettingsView container for signed-in
// users; swaps its route-based sign-in card for an openWindow("masuk") empty
// state so the settings window stays inside the desktop shell.
function ProfilSection() {
  const { isAuthenticated, isLoading } = useCurrentProfile();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4" aria-busy="true">
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-9 w-40" />
      </div>
    );
  }

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
        <Button
          className="min-h-11"
          onClick={() => openWindow("masuk", "Masuk")}
        >
          <LogIn className="size-4" />
          Masuk
        </Button>
      </Empty>
    );
  }

  return <ProfileSettingsView />;
}

export default function PengaturanApp(_props: AppProps) {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-10 p-6 sm:p-8">
      <header className="space-y-2">
        <span className="eyebrow">Akun · Preferensi</span>
        <h1 className="text-3xl sm:text-4xl">
          <em className="italic text-primary">Pengaturan</em>
        </h1>
        <p className="max-w-xl text-pretty text-muted-foreground">
          Atur tampilan aplikasi dan perbarui profil belajarmu.
        </p>
      </header>

      <section className="min-w-0 space-y-4">
        <div className="flex flex-col gap-1 border-b pb-3">
          <span className="eyebrow">Tampilan</span>
          <h2 className="font-serif text-2xl">Tema &amp; warna</h2>
          <p className="max-w-xl text-pretty text-sm text-muted-foreground">
            Pilih mode terang atau gelap dan warna aksen kesukaanmu.
          </p>
        </div>
        <ThemePresetSwitcher />
      </section>

      <section className="min-w-0 space-y-4">
        <div className="flex flex-col gap-1 border-b pb-3">
          <span className="eyebrow">Profil</span>
          <h2 className="font-serif text-2xl">Profil belajar</h2>
          <p className="max-w-xl text-pretty text-sm text-muted-foreground">
            Nama tampilan, username, dan bio yang dilihat komunitas.
          </p>
        </div>
        <ProfilSection />
      </section>
    </div>
  );
}
