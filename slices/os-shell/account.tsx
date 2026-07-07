"use client";
// Account control — who's signed in + a WORKING sign-out, wired to @convex-dev/auth.
// Two presentations share one hook: AccountMenu fills appshell's otherwise-empty
// `menuBarStatus` slot (the macOS menu-bar trailing cluster), and AccountSettings is
// a Pengaturan section that reaches EVERY shell (the menu bar exists only on macOS).
//
// Why this exists: appshell's own brand-menu "Log Out" POSTs to /api/auth/logout,
// a route that doesn't exist — so it's a no-op. Until that's fixed upstream, the
// signOut() here is the only thing that actually ends the session.
import { useAuthActions } from "@convex-dev/auth/react";
import { CircleUser, LogOut, LogIn, ShieldCheck } from "lucide-react";
import { defineFeature, toast } from "@/features/appshell";
import { useCurrentProfile } from "@/features/profiles";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { openApp } from "./apps/_nav";

function useAccount() {
  const { profile, isAuthenticated, isLoading } = useCurrentProfile();
  const { signOut } = useAuthActions();
  return {
    isLoading,
    isAuthenticated,
    name: profile?.displayName ?? "Akun",
    username: profile?.username ?? null,
    avatarUrl: profile?.avatarUrl ?? null,
    isAdmin: profile?.isPlatformAdmin === true,
    signOut: async () => {
      await signOut();
      toast("Kamu sudah keluar.");
    },
    openMasuk: () => openApp("masuk", "Masuk"),
    openProfil: () => openApp("profil", "Profil"),
  };
}

function Avatar({ url, className }: { url: string | null; className?: string }) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element -- external OAuth avatar, no next/image
    return <img src={url} alt="" className={cn("rounded-full object-cover", className)} />;
  }
  return (
    <span className={cn("grid place-items-center rounded-full bg-primary/15 text-primary", className)}>
      <CircleUser className="size-[62%]" aria-hidden />
    </span>
  );
}

// macOS menu-bar trailing item. Signed-out → a compact "Masuk"; signed-in → an
// avatar button opening a popover with profile + Keluar. Renders null while auth
// is still resolving so it doesn't flash. Popover portals out of the menu bar.
export function AccountMenu() {
  const a = useAccount();
  if (a.isLoading) return null;

  if (!a.isAuthenticated) {
    return (
      <Button
        type="button"
        variant="ghost"
        onClick={a.openMasuk}
        className="h-auto flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-normal text-muted-foreground hover:bg-[var(--hover-strong)]"
      >
        <LogIn className="size-3.5" />
        <span>Masuk</span>
      </Button>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`Akun: ${a.name}`}
          className="h-auto grid size-6 place-items-center rounded-md hover:bg-[var(--hover-strong)]"
        >
          <Avatar url={a.avatarUrl} className="size-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-60 p-0">
        <div className="flex items-center gap-3 border-b p-3">
          <Avatar url={a.avatarUrl} className="size-9" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{a.name}</p>
            {a.username && <p className="truncate text-xs text-muted-foreground">@{a.username}</p>}
          </div>
          {a.isAdmin && <ShieldCheck className="size-4 shrink-0 text-primary" aria-label="Admin" />}
        </div>
        <div className="flex flex-col p-1">
          <Button
            variant="ghost"
            className="h-auto justify-start gap-2 px-2 py-1.5 text-sm font-normal"
            onClick={a.openProfil}
          >
            <CircleUser className="size-4" /> Profil saya
          </Button>
          <Button
            variant="ghost"
            className="h-auto justify-start gap-2 px-2 py-1.5 text-sm font-normal text-destructive hover:text-destructive"
            onClick={a.signOut}
          >
            <LogOut className="size-4" /> Keluar
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Pengaturan "Akun" section — the universal sign-out home (every shell can open
// Pengaturan). Renders only when signed in; the signed-out sign-in prompt is owned
// by pengaturan-app's ProfilSection, so this doesn't duplicate it.
export function AccountSettings() {
  const a = useAccount();
  if (a.isLoading || !a.isAuthenticated) return null;

  return (
    <section className="min-w-0 space-y-4">
      <div className="flex flex-col gap-1 border-b pb-3">
        <span className="eyebrow">Akun</span>
        <h2 className="font-serif text-2xl">Sesi masuk</h2>
        <p className="max-w-xl text-pretty text-sm text-muted-foreground">
          Kamu masuk sebagai berikut. Bisa keluar kapan saja.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-3">
        <Avatar url={a.avatarUrl} className="size-11" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{a.name}</p>
          {a.username && <p className="truncate text-xs text-muted-foreground">@{a.username}</p>}
        </div>
        {a.isAdmin && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            <ShieldCheck className="size-3.5" /> Admin
          </span>
        )}
        <Button variant="outline" size="sm" className="shrink-0 gap-1.5" onClick={a.signOut}>
          <LogOut className="size-4" /> Keluar
        </Button>
      </div>
    </section>
  );
}

// Fills the macOS menu-bar trailing slot (empty in stock appshell) with the account
// control. Other shells reach the same account via AccountSettings in Pengaturan.
export const accountFeature = defineFeature({
  id: "account",
  kind: "custom",
  slots: { menuBarStatus: AccountMenu },
});
