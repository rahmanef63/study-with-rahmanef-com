"use client";

// Inbox mount. listMine is requireUser server-side, so an anonymous visitor
// gets a login gate up front instead of a thrown query.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";
import { NotificationInbox } from "@/features/notifications";
import { useCurrentProfile } from "@/features/profiles";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";

export function NotifikasiInbox() {
  const { isAuthenticated, isLoading } = useCurrentProfile();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="space-y-3" aria-busy>
        <span className="sr-only">Memuat notifikasi…</span>
        <Skeleton className="h-14 w-full rounded-md" />
        <Skeleton className="h-14 w-full rounded-md" />
        <Skeleton className="h-14 w-full rounded-md" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <LogIn aria-hidden />
          </EmptyMedia>
          <EmptyTitle className="font-display">Masuk untuk melihat notifikasi</EmptyTitle>
          <EmptyDescription className="text-pretty">
            Setelah masuk, balasan dan kabar komunitasmu tampil di sini.
          </EmptyDescription>
        </EmptyHeader>
        <Button asChild className="min-h-11">
          <Link href="/masuk?next=%2Fnotifikasi">
            <LogIn aria-hidden className="size-4" /> Masuk
          </Link>
        </Button>
      </Empty>
    );
  }

  return (
    <div className="rounded-xl border bg-card">
      {/* Every stored href is a same-origin path (the Convex validator rejects
          absolute URLs), so router.push keeps this a client navigation instead
          of the slice's default full page load. */}
      <NotificationInbox
        onNavigate={(href) => router.push(href)}
        className="flex max-h-[70vh] w-full flex-col"
      />
    </div>
  );
}
