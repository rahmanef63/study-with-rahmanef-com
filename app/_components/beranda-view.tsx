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
import { ArrowRight, LogIn, Trophy } from "lucide-react";
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
import { ART_SIZE } from "@/lib/art";
import { communityHref } from "@/lib/community";

const CARD = "rounded-[var(--radius)] border border-border bg-card p-4";

/** A number with its own picture. Three of these are the whole stats row. */
function Stat({ art, value, label }: { art: string; value: string; label: string }) {
  return (
    <div className={`${CARD} flex items-center gap-3`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- committed static asset. */}
      <img
        src={art}
        alt=""
        width={ART_SIZE.tile}
        height={ART_SIZE.tile}
        loading="lazy"
        decoding="async"
        className="pixelated size-11 shrink-0 object-contain"
      />
      <span className="flex min-w-0 flex-col">
        <span className="font-display text-marquee text-primary">{value}</span>
        <span className="truncate text-caption text-muted-foreground">{label}</span>
      </span>
    </div>
  );
}

/**
 * A course, its cover, and how far in you are.
 *
 * The bar is a plain div pair, not a component: it is two elements and one
 * width, and `--radius: 0` means there is no shape to get wrong. `aria-hidden`
 * on it because the percentage is already written in text beside the title —
 * a progressbar role would make a screen reader read the same number twice.
 */
function CourseRow({
  course,
  showBar,
}: {
  course: {
    slug: string;
    title: string;
    communitySlug: string;
    communityName: string;
    total: number;
    done: number;
    percent: number;
  };
  showBar: boolean;
}) {
  return (
    <li>
      <Link
        href={communityHref.course(course.communitySlug, course.slug)}
        className={`${CARD} group flex items-start gap-3 transition-colors hover:border-primary`}
      >
        <CourseCover slug={course.slug} className="size-14 shrink-0 border border-border" />
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="line-clamp-2 text-title font-medium leading-snug group-hover:text-primary">
            {course.title}
          </span>
          <span className="truncate text-caption text-muted-foreground">{course.communityName}</span>
          {showBar ? (
            <>
              <span aria-hidden className="mt-1 block h-2 w-full border border-border bg-muted">
                <span
                  className="block h-full bg-primary"
                  style={{ width: `${Math.max(course.percent, 4)}%` }}
                />
              </span>
              <span className="text-caption text-muted-foreground tabular-nums">
                {course.done} dari {course.total} materi · {course.percent}%
              </span>
            </>
          ) : (
            <span className="text-caption text-muted-foreground tabular-nums">
              {course.total} materi
            </span>
          )}
        </span>
      </Link>
    </li>
  );
}

function Section({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="mt-8">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="eyebrow">{title}</h2>
        {action}
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

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
        <Stat
          art="/ui/empty/courses.webp"
          value={`${data.materiDone}${plus}`}
          label="materi selesai"
        />
        <Stat
          art="/learning/badge/trophy.webp"
          value={`${data.badgeCount}${plus}`}
          label="kelas tuntas"
        />
        {/* The badge hexagon, not the campfire. `anggota.webp` was here and it
            failed at the size it actually renders: its dashed speech bubble
            survives the downscale to 44px and the campfire under it collapses
            into a smudge. Caught in a real browser, not in review — which is
            the lesson: a sprite that reads at 112px is not a sprite that reads
            at 44px, so check candidates at the BOX SIZE, not the file size. */}
        <Stat
          art="/learning/badge/community.webp"
          value={String(data.communities.length)}
          label="komunitas"
        />
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
