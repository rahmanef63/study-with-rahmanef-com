"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentProfile } from "@/features/profiles";
import { RoleChip, useMyCommunities } from "@/features/tenants";

// "Komunitas saya" (UI-UX-PRD §5.3 / G2). Reactive list from tenants.listMine
// (auth-gated); friendly signed-out + empty states.
export default function KomunitasSayaPage() {
  const { isAuthenticated, isLoading } = useCurrentProfile();
  const communities = useMyCommunities();

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-2xl font-semibold">Komunitas saya</h1>
      <p className="mt-1 text-muted-foreground">Komunitas belajar yang kamu ikuti.</p>

      <div className="mt-8">
        {!isAuthenticated && !isLoading ? (
          <div className="rounded-xl border border-dashed bg-muted/30 px-6 py-12 text-center">
            <p className="font-medium">Masuk untuk melihat komunitasmu</p>
            <Button asChild className="mt-4">
              <Link href="/login?returnTo=/komunitas-saya">Masuk dengan Google</Link>
            </Button>
          </div>
        ) : communities === undefined ? (
          <div className="grid gap-3">
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
          </div>
        ) : communities.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-muted/30 px-6 py-12 text-center">
            <p className="font-medium">Belum ikut komunitas apa pun 🌱</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
              Jelajahi komunitas yang ada, atau ajukan komunitasmu sendiri.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Button asChild variant="outline">
                <Link href="/#komunitas">Jelajahi komunitas</Link>
              </Button>
              <Button asChild>
                <Link href="/buka-komunitas">Buka komunitas</Link>
              </Button>
            </div>
          </div>
        ) : (
          <ul className="grid gap-3">
            {communities.map((c) => (
              <li key={c._id}>
                <Link
                  href={`/t/${c.slug}`}
                  className="flex items-center justify-between gap-4 rounded-xl border bg-card px-5 py-4 transition-colors hover:bg-accent/50"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{c.name}</p>
                    <p className="truncate text-sm text-muted-foreground">{c.description}</p>
                  </div>
                  <RoleChip role={c.role} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
