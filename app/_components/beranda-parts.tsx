"use client";

// The three presentational pieces of /beranda, split out of `beranda-view.tsx`
// when it crossed the 200-line ceiling (`npm run audit:file-size`). The seam is
// the honest one: everything here is stateless and prop-driven, while the view
// next door owns the query and every decision. Nothing else imports these — if
// a second screen ever needs them, that is the moment to promote them, not now.
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { CourseCover } from "@/features/courses";
import { communityHref } from "@/lib/community";

/** The framed card every block on this screen sits in. */
export const CARD = "rounded-[var(--radius)] border border-border bg-card p-4";
/** The framed accent tile every mark on this screen sits in. Same idiom as
 *  app/(shell)/home/page.tsx and slices/peta/components/peta-callout.tsx. */
export const TILE =
  "grid size-11 shrink-0 place-items-center rounded-[var(--radius)] border border-primary/40 bg-primary/10 text-primary";

/**
 * A number with its own mark. Three of these are the whole stats row.
 *
 * The mark is a framed Lucide glyph, not a pixel badge. Not because the badges
 * were illegible — `trophy` and `community` survive 44px, which is exactly why
 * they were chosen in 4869291 — but because the explore cards directly below on
 * this same screen now carry framed glyphs, and two icon languages at the same
 * size on one screen is the thing that reads as unfinished.
 */
export function Stat({ icon: Icon, value, label }: { icon: LucideIcon; value: string; label: string }) {
  return (
    <div className={`${CARD} flex items-center gap-3`}>
      <span className={TILE}>
        <Icon className="size-5" aria-hidden />
      </span>
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
 * width. It stays square on purpose — at 8px tall a 6px radius is most of the
 * bar. `aria-hidden` on it because the percentage is already written in text
 * beside the title, and a progressbar role would make a screen reader read the
 * same number twice.
 */
export function CourseRow({
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

export function Section({
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
