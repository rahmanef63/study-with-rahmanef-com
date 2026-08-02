"use client";
// Pengaturan — the OS "settings" app. Two sections: Tampilan (theme mode +
// color preset) and Profil (edit-profile form). Renders inside an appshell
// window, so it reads auth/profile client-side via the profiles slice hooks
// (root layout already mounts Convex + the theme-preset provider).
//
// The profile form itself is REUSED from @/features/profiles — this app only
// gates it: a logged-out viewer gets an OS-native empty state that opens the
// "masuk" (sign-in) window instead of navigating to the /login route.
import { type AppProps, shellsForSurface, useShellPrefs, setShell } from "@/features/appshell";
import { openApp } from "./_nav";
import { AccountSettings } from "../account";
import { ThemePresetGallery } from "@/features/theme-presets";
import { ProfileSettingsView, useCurrentProfile } from "@/features/profiles";
import { Hero, SectionHeader, Badge } from "@/components/mockup-kit";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Check, LogIn, UserRound } from "lucide-react";

// Tampilan OS — per-surface shell picker (desktop + mobile chosen independently).
// Uses appshell's shell registry (setShell persists to localStorage; live switch).
function ShellSection() {
  const prefs = useShellPrefs();
  const rows: { surface: "desktop" | "mobile"; label: string; hint: string }[] = [
    { surface: "desktop", label: "Layar lebar", hint: "Desktop" },
    { surface: "mobile", label: "Layar sentuh", hint: "Mobile" },
  ];
  return (
    <div className="space-y-6">
      {rows.map(({ surface, label, hint }) => (
        <div key={surface} className="space-y-2">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-sm font-medium">{label}</span>
            <span className="eyebrow">{hint}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 @md:grid-cols-3 @xl:grid-cols-4 @2xl:grid-cols-5">
            {shellsForSurface(surface).map((s) => {
              const active = prefs[surface] === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setShell(surface, s.id)}
                  aria-pressed={active}
                  className={cn(
                    "flex min-h-11 items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active
                      ? "border-primary/50 bg-primary/10 text-primary"
                      : "border-border hover:bg-accent/40"
                  )}
                >
                  <span className="min-w-0 truncate font-medium">{s.label}</span>
                  {active ? <Check className="size-4 shrink-0" aria-hidden /> : null}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      <p className="text-xs text-muted-foreground">
        Ganti gaya OS — macOS, Windows, Android, iOS, atau Dasbor. Berlaku langsung.
      </p>
    </div>
  );
}

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
          onClick={() => openApp("masuk", "Masuk")}
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
    <div className="w-full space-y-10 p-6 @md:p-8">
      <Hero
        eyebrow="Akun · Preferensi"
        title={<em className="italic text-primary">Pengaturan</em>}
        description="Atur tampilan aplikasi dan perbarui profil belajarmu."
      />

      <AccountSettings />

      <section className="min-w-0 space-y-5">
        <div>
          <SectionHeader eyebrow="Tampilan" title="Tema & warna" className="mb-2.5" />
          <p className="max-w-xl text-pretty text-sm text-muted-foreground">
            Pilih mode terang atau gelap dan warna aksen kesukaanmu.
          </p>
        </div>
        <ThemePresetGallery />
      </section>

      <section className="min-w-0 space-y-5">
        <div>
          <SectionHeader
            eyebrow="Tampilan OS"
            title="Gaya desktop"
            actions={<Badge tone="accent">Berlaku langsung</Badge>}
            className="mb-2.5"
          />
          <p className="max-w-xl text-pretty text-sm text-muted-foreground">
            Pilih chrome OS untuk layar lebar dan sentuh — boleh beda.
          </p>
        </div>
        <ShellSection />
      </section>

      <section className="min-w-0 space-y-5">
        <div>
          <SectionHeader eyebrow="Profil" title="Profil belajar" className="mb-2.5" />
          <p className="max-w-xl text-pretty text-sm text-muted-foreground">
            Nama tampilan, username, dan bio yang dilihat komunitas.
          </p>
        </div>
        <div className="w-full max-w-2xl">
          <ProfilSection />
        </div>
      </section>
    </div>
  );
}
