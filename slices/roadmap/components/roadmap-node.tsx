"use client";
// roadmap slice — one lesson step. Presentational + prop-driven (ported from
// CareerPack's skill-roadmap RoadmapNodeComponent — a dependency-free flex/lucide
// card — remapped to this app's Editorial Warmth tokens). Opening the lesson is a
// plain anchor (#lesson/<id>) that the Kelas window intercepts; the circle is a
// member-only "mark complete".
import { CheckCircle2, ChevronRight, Circle, Lock, PlayCircle, Video } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RoadmapLesson } from "../types";

export type RoadmapNodeProps = {
  lesson: RoadmapLesson;
  /** In-window lesson href (the Kelas window turns #lesson/<id> into a nav). */
  href: string;
  /** Member "mark complete" — omit for anon/locked/done. */
  onComplete?: () => void;
  completing?: boolean;
};

export function RoadmapNode({ lesson, href, onComplete, completing }: RoadmapNodeProps) {
  const { status, title, hasVideo } = lesson;
  const done = status === "done";
  const locked = status === "locked";
  const active = status === "next";

  return (
    <div className="relative">
      {active && (
        <span className="pointer-events-none absolute -inset-0.5 rounded-[var(--radius-win)] ring-2 ring-primary/50 animate-pulse" aria-hidden />
      )}
      <div
        className={cn(
          "relative flex items-center gap-3 rounded-[var(--radius-win)] border-2 p-3 transition-colors",
          done
            ? "border-success/40 bg-success/5"
            : locked
              ? "border-border bg-muted/40 opacity-70"
              : active
                ? "border-primary/50 bg-primary/5 shadow-sm"
                : "border-border bg-card hover:border-primary/40",
        )}
      >
        {onComplete && !done && !locked ? (
          <button
            type="button"
            onClick={onComplete}
            disabled={completing}
            aria-label={`Tandai selesai: ${title}`}
            className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary transition-colors hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
          >
            {active ? <PlayCircle className="size-5" /> : <Circle className="size-5" />}
          </button>
        ) : (
          <span
            className={cn(
              "grid size-9 shrink-0 place-items-center rounded-full",
              done ? "bg-success text-success-foreground" : locked ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary",
            )}
            aria-hidden
          >
            {done ? <CheckCircle2 className="size-5" /> : locked ? <Lock className="size-4" /> : <Circle className="size-5" />}
          </span>
        )}

        {locked ? (
          <span className="min-w-0 flex-1">
            <span className="block truncate font-medium text-muted-foreground">{title}</span>
            <span className="text-xs text-muted-foreground">Gabung untuk membuka</span>
          </span>
        ) : (
          <a href={href} className="group flex min-w-0 flex-1 items-center gap-2 focus-visible:outline-none">
            <span className="min-w-0 flex-1">
              <span className={cn("block truncate font-medium", done ? "text-success" : "group-hover:text-primary")}>{title}</span>
              <span className="flex items-center gap-2 text-xs text-muted-foreground">
                {hasVideo ? (
                  <span className="inline-flex items-center gap-1"><Video className="size-3" aria-hidden /> Video</span>
                ) : null}
                {active && !done ? <span className="text-primary">· Lanjut di sini</span> : null}
              </span>
            </span>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground group-hover:text-primary" aria-hidden />
          </a>
        )}
      </div>
    </div>
  );
}
