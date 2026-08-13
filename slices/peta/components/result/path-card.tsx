"use client";
// One ranked path. The three parts, in the order a learner needs them:
// WHY this was picked (their own words, quoted back), WHAT to do this week
// (three steps, concrete enough to start tonight), and WHERE it lives on the
// platform (the courses, in teaching order).
//
// The weekly steps come BEFORE the course links on purpose. A stranger who
// bounces after reading one card should still leave with something they can do
// without an account; the courses are the follow-through, not the entry fee.
import Link from "next/link";
import { ART_SIZE } from "@/lib/art";
import { communityHref } from "@/lib/community";
import type { RankedPath } from "@/lib/peta";

export type PathCardProps = { path: RankedPath; rank: number };

export function PathCard({ path, rank }: PathCardProps) {
  return (
    <article className="border-2 border-border bg-card p-5 shadow-[3px_3px_0_0_var(--pixel-shadow)]">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center border-2 border-primary bg-primary/10 px-2 py-0.5 font-display text-caption text-primary">
          {rank === 1 ? "Paling cocok" : `Pilihan ${rank}`}
        </span>
        <span className="text-caption text-muted-foreground tabular-nums">
          Kecocokan {path.score}%
        </span>
      </div>
      <div className="mt-3 flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element -- committed static asset. */}
        <img
          src={path.art}
          alt=""
          width={ART_SIZE.tile}
          height={ART_SIZE.tile}
          loading="lazy"
          decoding="async"
          className="pixelated size-11 shrink-0 object-contain"
        />
        <h3 className="min-w-0 text-balance font-display text-marquee">{path.title}</h3>
      </div>
      <p className="mt-2 text-pretty text-body text-muted-foreground">{path.summary}</p>
      <p className="mt-3 text-pretty text-footnote">{path.reason}</p>

      <h4 className="eyebrow mt-5">Minggu ini</h4>
      <ol className="mt-2 grid gap-2">
        {path.thisWeek.map((step, i) => (
          <li key={step} className="flex gap-3">
            <span
              aria-hidden
              className="grid size-6 shrink-0 place-items-center border-2 border-border font-display text-[0.5rem] text-muted-foreground"
            >
              {i + 1}
            </span>
            <span className="min-w-0 text-pretty text-footnote">{step}</span>
          </li>
        ))}
      </ol>

      {path.courses.length > 0 ? (
        <>
          <h4 className="eyebrow mt-5">Kelasnya</h4>
          <ul className="mt-2 grid gap-2">
            {path.courses.map((course) => (
              <li key={`${course.communitySlug}/${course.courseSlug}`}>
                <Link
                  href={communityHref.course(course.communitySlug, course.courseSlug)}
                  className="flex min-h-11 items-center gap-3 border-2 border-border px-3 py-2 text-footnote transition-colors duration-75 [transition-timing-function:steps(2,end)] hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
                >
                  <span className="min-w-0 flex-1">{course.title}</span>
                  <span aria-hidden className="list-chevron shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        </>
      ) : (
        // Every course of this path is unpublished right now. Say so instead of
        // linking into a 404 — the weekly steps above still stand on their own.
        <p className="mt-5 text-footnote text-muted-foreground">
          Kelas untuk jalur ini belum terbit. Langkah mingguannya tetap bisa kamu kerjakan sendiri.
        </p>
      )}
    </article>
  );
}
