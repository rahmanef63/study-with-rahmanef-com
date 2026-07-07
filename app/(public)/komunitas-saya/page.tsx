"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentProfile } from "@/features/profiles";
import { RoleChip, useMyCommunities } from "@/features/tenants";

// "Komunitas saya" (UI-UX-PRD §5.3 / G2). Reactive list from tenants.listMine
// (auth-gated); friendly signed-out + empty states.
export default function KomunitasSayaPage() {
  const { isAuthenticated, isLoading } = useCurrentProfile();
  const communities = useMyCommunities();

  return (
    <div className="mx-auto max-w-3xl px-6 py-12 sm:py-16">
      <span className="eyebrow">Komunitas</span>
      <h1 className="mt-2 text-3xl sm:text-4xl">Komunitas saya</h1>
      <p className="mt-2 text-pretty text-muted-foreground">
        Komunitas belajar yang kamu ikuti.
      </p>

      <div className="mt-8">
        {!isAuthenticated && !isLoading ? (
          <div className="rounded-xl border border-dashed bg-muted/30 px-6 py-12 text-center">
            <p className="font-medium">Masuk untuk melihat komunitasmu</p>
            <Button asChild className="mt-4 min-h-11 sm:min-h-9">
              <Link href="/login?returnTo=/komunitas-saya">Masuk dengan Google</Link>
            </Button>
          </div>
        ) : communities === undefined ? (
          <div className="grid gap-3">
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
          </div>
        ) : communities.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyTitle>Belum ikut komunitas apa pun 🌱</EmptyTitle>
              <EmptyDescription>
                Jelajahi komunitas yang ada, atau ajukan komunitasmu sendiri.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <div className="flex flex-wrap justify-center gap-2">
                <Button asChild variant="outline" className="min-h-11 sm:min-h-9">
                  <Link href="/#komunitas">Jelajahi komunitas</Link>
                </Button>
                <Button asChild className="min-h-11 sm:min-h-9">
                  <Link href="/buka-komunitas">Buka komunitas</Link>
                </Button>
              </div>
            </EmptyContent>
          </Empty>
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
