"use client";
// roadmap slice — one STATION on the learning-path "quest trail". Presentational +
// prop-driven (evolved from CareerPack's skill-roadmap node, remapped to this app's
// Editorial Warmth tokens). A big circular node sits over the module's progress
// spine (drawn by the parent <ol>), with a station card to its right. This is the
// game-map look — deliberately unlike the dense syllabus rows. Opening the lesson is
// a plain anchor (#lesson/<id>) the Kelas window intercepts; the circle is a
// member-only "mark complete".
// ponytail: left-anchored spine, not a center-zigzag — one column survives every
// shell/window width; alternating cards overflow narrow containers. Add zigzag later
// behind a container-query if a wider "map" is wanted.
import { Check, ChevronRight, Flag, Lock, Play, BookOpen, Video } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RoadmapLesson } from "../types";

export type RoadmapNodeProps = {
  lesson: RoadmapLesson;
  /** 1-based step number within the course (shown on unopened stations). */
  step: number;
  /** In-window lesson href (the Kelas window turns #lesson/<id> into a nav). */
  href: string;
  /** Member "mark complete" — omit for anon/locked/done. */
  onComplete?: () => void;
  completing?: boolean;
};

const STATUS_WORD: Record<RoadmapLesson["status"], string> = {
  done: "Selesai",
  next: "Kamu di sini",
  available: "Terbuka",
  locked: "Terkunci",
};

export function RoadmapNode({ lesson, step, href, onComplete, completing }: RoadmapNodeProps) {
  const { status, title, hasVideo } = lesson;
  const done = status === "done";
  const locked = status === "locked";
  const active = status === "next";
  const TypeIcon = hasVideo ? Video : BookOpen;

  const circleInner = done ? (
    <Check className="size-6" aria-hidden />
  ) : locked ? (
    <Lock className="size-4" aria-hidden />
  ) : active ? (
    <Play className="size-5 fill-current" aria-hidden />
  ) : (
    <span className="text-sm font-bold tabular-nums">{step}</span>
  );

  const circleClass = cn(
    "grid size-12 shrink-0 place-items-center rounded-full border-2 bg-background transition-transform",
    done
      ? "border-success bg-success text-success-foreground"
      : locked
        ? "border-border bg-muted text-muted-foreground"
        : active
          ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/25"
          : "border-primary/40 bg-card text-primary",
    onComplete && !done && !locked && "hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-60",
  );

  return (
    <li className="relative flex gap-4 pb-7 last:pb-0">
      {/* Station marker — sits over the module spine. Solid bg masks the line behind. */}
      <div className="relative z-10 shrink-0">
        {active && (
          <span
            className="pointer-events-none absolute -inset-1 rounded-full ring-2 ring-primary/40 motion-safe:animate-ping"
            aria-hidden
          />
        )}
        {onComplete && !done && !locked ? (
          <button
            type="button"
            onClick={onComplete}
            disabled={completing}
            aria-label={`Tandai selesai: ${title}`}
            className={circleClass}
          >
            {circleInner}
          </button>
        ) : (
          <span className={circleClass} aria-hidden={!done && !locked}>
            {circleInner}
          </span>
        )}
        {/* "Kamu di sini" beacon flag on the active station */}
        {active && (
          <span className="absolute -right-1 -top-2 z-10 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
            <Flag className="size-3" aria-hidden />
          </span>
        )}
      </div>

      {/* Station card */}
      {locked ? (
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-[var(--radius-win)] border border-dashed border-border bg-muted/30 px-4 py-3 opacity-80">
          <span className="min-w-0 flex-1">
            <span className="block truncate font-medium text-muted-foreground">{title}</span>
            <span className="text-xs text-muted-foreground">🔒 Gabung kelas untuk membuka</span>
          </span>
        </div>
      ) : (
        <a
          href={href}
          className={cn(
            "group flex min-w-0 flex-1 items-center gap-3 rounded-[var(--radius-win)] border p-3 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            done
              ? "border-success/30 bg-success/5 hover:border-success/50"
              : active
                ? "border-primary/50 bg-primary/5 shadow-md ring-1 ring-primary/15 hover:shadow-lg"
                : "border-border bg-card hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md",
          )}
        >
          <span className="min-w-0 flex-1">
            <span
              className={cn(
                "block truncate font-medium",
                done ? "text-success" : "text-foreground group-hover:text-primary",
              )}
            >
              {title}
            </span>
            <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <TypeIcon className="size-3" aria-hidden /> {hasVideo ? "Video" : "Bacaan"}
              </span>
              <span aria-hidden>·</span>
              <span>Langkah {step}</span>
              <span aria-hidden>·</span>
              <span className={cn(active && "font-medium text-primary", done && "text-success")}>
                {STATUS_WORD[status]}
              </span>
            </span>
          </span>
          <ChevronRight
            className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
            aria-hidden
          />
        </a>
      )}
    </li>
  );
}
