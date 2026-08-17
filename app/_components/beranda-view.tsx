"use client";

// The signed-in half of /beranda: what you are in the middle of.
//
// A client island because the whole page is the caller's own state and the
// server here is permanently anonymous. ONE query — `progress/overview:getMine`
// exists precisely so this screen is not 1 + T + C subscriptions.
//
// SHAPE, top to bottom: three numbers, then the thing you were doing, then the
// thing to pick up next, then where you belong. That order is the question a
// home screen answers — "where was I" before "what else is there".
import Link from "next/link";
import { useEffect, useState } from "react";
import { useConvexAuth, useQuery } from "convex/react";
import { ArrowRight, BookCheck, LogIn, Trophy, Users } from "lucide-react";
import { api } from "@convex/_generated/api";
import { CourseCover } from "@/features/courses";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Empty,
  EmptyArt,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { communityHref } from "@/lib/community";
import { CARD, CourseRow, Section, Stat, TILE } from "./beranda-parts";

export function BerandaView() {
  // `getMine` is `requireUser` on its first line, so an anonymous caller gets a
  // thrown ConvexError — and a throwing `useQuery` does not degrade, it takes
  // the whole route to app/error.tsx. Measured: /home rendered "Ada yang tidak
  // beres" for every signed-out visitor before this guard existed. "skip" until
  // the session is known is the only correct way to call an authed query from a
  // page anyone can open.
  const { isAuthenticated, isLoading } = useConvexAuth();
  const data = useQuery(api.features.progress.overview.getMine, isAuthenticated ? {} : "skip");

  // Convex auth reads localStorage, so the client's FIRST render can already
  // know the answer while the server HTML says "unknown" — hold until mounted
  // so the two agree (the same guard the rail's user block carries).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (mounted && !isLoading && !isAuthenticated) {
    return (
      <Empty className="border border-dashed">
        <EmptyHeader>
          <EmptyArt src="/ui/empty/statistik.webp" />
          <EmptyTitle className="font-display">
            Masuk untuk lihat ringkasanmu
          </EmptyTitle>
          <EmptyDescription className="text-pretty">
            Setelah masuk, kelas yang sedang kamu jalani, progresnya, dan komunitasmu tampil di sini.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Link
            href="/masuk?next=%2Fhome"
            className="pixel-press inline-flex min-h-11 items-center gap-2 border border-primary bg-primary px-5 text-title font-medium text-primary-foreground shadow-sm"
          >
            <LogIn className="size-4" aria-hidden />
            Masuk
          </Link>
        </EmptyContent>
      </Empty>
    );
  }

  if (!mounted || isLoading || data === undefined) {
    return (
      <div className="space-y-3" aria-busy>
        <span className="sr-only">Memuat ringkasanmu…</span>
        <div className="grid grid-cols-3 gap-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
    );
  }

  const plus = data.truncated ? "+" : "";

  if (data.communities.length === 0) {
    return (
      <Empty className="border border-dashed">
        <EmptyHeader>
          <EmptyArt src="/ui/empty/discovery.webp" />
          <EmptyTitle className="font-display">
            Belum gabung komunitas
          </EmptyTitle>
          <EmptyDescription className="text-pretty">
            Kelas dan materi hidup di dalam komunitas. Pilih satu di bawah — semuanya gratis.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 gap-3 @sm:grid-cols-3">
        <Stat icon={BookCheck} value={`${data.materiDone}${plus}`} label="materi selesai" />
        <Stat icon={Trophy} value={`${data.badgeCount}${plus}`} label="kelas tuntas" />
        <Stat icon={Users} value={String(data.communities.length)} label="komunitas" />
      </div>

      {data.inProgress.length > 0 ? (
        <Section title="Lanjutkan belajar">
          <ul className="grid gap-3 @2xl:grid-cols-2">
            {data.inProgress.slice(0, 4).map((c) => (
              <CourseRow key={c.courseId} course={c} showBar />
            ))}
          </ul>
        </Section>
      ) : null}

      {data.notStarted.length > 0 ? (
        <Section
          title={data.inProgress.length > 0 ? "Belum dimulai" : "Mulai dari sini"}
          action={
            <Link
              href={communityHref.home(data.communities[0]!.slug)}
              className="inline-flex min-h-11 items-center gap-1.5 text-footnote text-muted-foreground hover:text-primary"
            >
              Semua kelas
              <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          }
        >
          <ul className="grid gap-3 @2xl:grid-cols-2">
            {data.notStarted.slice(0, 4).map((c) => (
              <CourseRow key={c.courseId} course={c} showBar={false} />
            ))}
          </ul>
        </Section>
      ) : null}

      <Section title="Komunitasmu">
        <ul className="grid gap-3 @2xl:grid-cols-2">
          {data.communities.map((t) => (
            <li key={t.slug}>
              <Link
                href={communityHref.home(t.slug)}
                className={`${CARD} group flex items-center gap-3 transition-colors hover:border-primary`}
              >
                <CourseCover slug={t.slug} className="size-11 shrink-0 border border-border" />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-title font-medium group-hover:text-primary">
                    {t.name}
                  </span>
                  <span className="truncate text-caption text-muted-foreground">
                    {t.courseCount} kelas
                    {t.role === "member" ? "" : ` · ${t.role === "owner" ? "pemilik" : "pengajar"}`}
                  </span>
                </span>
                {t.role === "member" ? null : (
                  <Trophy className="size-4 shrink-0 text-primary" aria-hidden />
                )}
              </Link>
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}
