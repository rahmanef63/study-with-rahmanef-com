"use client";
// Notifikasi — the full-window inbox app (#27, mounts STATUS #21). Deep-link:
// /notifikasi. The macOS/Windows/Dashboard shells also get the compact
// NotificationBell in the menu-bar status cluster (notifications-status.tsx);
// this app is the everywhere-else home (mobile shells have no menu bar) and
// the "see all" surface. listMine is requireUser server-side, so anon gets a
// login gate up front instead of a thrown query.
import { type AppProps } from "@/features/appshell";
import { NotificationInbox } from "@/features/notifications";
import { useCurrentProfile } from "@/features/profiles";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { Hero } from "@/components/mockup-kit";
import { LogIn } from "lucide-react";
import { openApp, openHref } from "./_nav";

export default function NotifikasiApp(_props: AppProps) {
  const { isAuthenticated, isLoading } = useCurrentProfile();

  return (
    <div className="w-full space-y-8 p-6 @sm:p-8">
      <Hero
        eyebrow="Notifikasi"
        title={
          <>
            Kabar <em className="italic text-primary">terbaru untukmu</em>.
          </>
        }
        description="Balasan diskusi, hasil kurasi sumber, dan status usulanmu — semua di satu kotak."
      />

      {isLoading ? (
        <div className="space-y-3" aria-busy>
          <span className="sr-only">Memuat notifikasi…</span>
          <Skeleton className="h-14 w-full rounded-md" />
          <Skeleton className="h-14 w-full rounded-md" />
          <Skeleton className="h-14 w-full rounded-md" />
        </div>
      ) : !isAuthenticated ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <LogIn aria-hidden />
            </EmptyMedia>
            <EmptyTitle className="font-serif">Masuk untuk melihat notifikasi</EmptyTitle>
            <EmptyDescription className="text-pretty">
              Setelah masuk, balasan dan kabar komunitasmu tampil di sini.
            </EmptyDescription>
          </EmptyHeader>
          <Button className="min-h-11" onClick={() => openApp("masuk", "Masuk")}>
            <LogIn aria-hidden className="size-4" /> Masuk
          </Button>
        </Empty>
      ) : (
        <div className="rounded-[var(--radius-win)] border bg-card">
          <NotificationInbox onNavigate={openHref} />
        </div>
      )}
    </div>
  );
}
