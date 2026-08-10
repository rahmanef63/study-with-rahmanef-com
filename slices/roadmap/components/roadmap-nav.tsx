"use client";
// roadmap slice — the compact COURSE NAV rail. The secondary sidebar shown
// beside a materi sheet: the course's ordered materi with the current one
// highlighted, so you can hop between them without leaving the sheet.
// Self-contained (derives from courses+progress; owns no data).
//
// MATERI MODEL (DECISIONS #37): the course is a FLAT ordered list of materi,
// so the module grouping this rail used to draw is gone — one list, one
// numbered sequence, which is also what the Silabus now shows.
import { useMemo } from "react";
import { Check, ChevronLeft, Lock, Play } from "lucide-react";
import type { Id } from "@convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { useCourseOverview } from "@/features/courses";
import { useCourseProgress, toPercent } from "@/features/progress";
import { Skeleton } from "@/components/ui/skeleton";
import type { RoadmapLesson, RoadmapNodeStatus } from "../types";

// Screen-reader status label — the StatusDot icons are aria-hidden (color/shape only),
// so this is the only status signal AT gets per row.
const STATUS_WORD: Record<RoadmapNodeStatus, string> = {
  done: "Selesai",
  next: "Kamu di sini",
  available: "Terbuka",
  locked: "Terkunci",
};

export type CourseNavProps = {
  tenantId: Id<"tenants">;
  courseSlug: string;
  /** Materi route builder. */
  lessonHref: (lessonId: string) => string;
  /** Back to the full course overview / map. */
  overviewHref: string;
  /** The materi currently open in the sheet — highlighted in the rail. */
  currentLessonId?: string | null;
};

function StatusDot({ status, current }: { status: RoadmapNodeStatus; current: boolean }) {
  const base = "grid size-5 shrink-0 place-items-center border";
  if (status === "done")
    return (
      <span className={cn(base, "border-success bg-success text-success-foreground")} aria-hidden>
        <Check className="size-3" />
      </span>
    );
  if (status === "locked")
    return (
      <span className={cn(base, "border-border bg-muted text-muted-foreground")} aria-hidden>
        <Lock className="size-2.5" />
      </span>
    );
  if (status === "next")
    return (
      <span className={cn(base, "border-primary bg-primary text-primary-foreground")} aria-hidden>
        <Play className="size-2.5 fill-current" />
      </span>
    );
  return (
    <span
      className={cn(base, current ? "border-primary bg-primary/15" : "border-primary/40 bg-card")}
      aria-hidden
    />
  );
}

export function CourseNav({
  tenantId,
  courseSlug,
  lessonHref,
  overviewHref,
  currentLessonId,
}: CourseNavProps) {
  const overview = useCourseOverview(tenantId, courseSlug);
  const isMember = overview?.viewerRole != null;
  const progress = useCourseProgress(isMember ? overview?.course._id : undefined);

  const steps: RoadmapLesson[] = useMemo(() => {
    if (!overview) return [];
    const done = new Set<string>(progress?.completedLessonIds ?? []);
    const nextId = overview.lessons.find((l) => !done.has(l._id))?._id ?? null;
    const statusOf = (id: Id<"lessons">): RoadmapNodeStatus => {
      if (!isMember) return "locked";
      if (done.has(id)) return "done";
      if (id === nextId) return "next";
      return "available";
    };
    return overview.lessons.map((l) => ({
      id: l._id,
      title: l.title,
      hasVideo: l.hasVideo,
      status: statusOf(l._id),
    }));
  }, [overview, progress, isMember]);

  if (overview === undefined) {
    return (
      <div className="space-y-2">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
    );
  }

  const total = progress?.totalCount ?? overview.lessonCount;
  const completed = progress?.completedCount ?? 0;

  return (
    <div className="flex flex-col gap-3 text-sm">
      {/* Header — back to the full map + course title */}
      <a
        href={overviewHref}
        className="group inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ChevronLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" aria-hidden />
        Kembali ke peta
      </a>
      <p className="min-w-0 truncate font-display text-base font-medium leading-tight">{overview.course.title}</p>
      {isMember && total > 0 && (
        <div className="space-y-1">
          <div className="h-1.5 w-full overflow-hidden bg-muted">
            <div className="h-full bg-primary" style={{ width: `${toPercent(completed, total)}%` }} />
          </div>
          <p className="text-[0.7rem] text-muted-foreground tabular-nums">
            {completed}/{total} selesai
          </p>
        </div>
      )}

      {/* Nav list — one flat, numbered sequence (the course IS the order). */}
      <nav aria-label="Daftar materi">
        <ol className="divide-y divide-border border-y border-border">
          {steps.map((l, index) => {
            const current = l.id === currentLessonId;
            const row = (
              <span className="flex min-w-0 flex-1 items-center gap-2">
                <span className="w-5 shrink-0 text-right text-[0.65rem] tabular-nums text-muted-foreground">
                  {index + 1}
                </span>
                <StatusDot status={l.status} current={current} />
                <span
                  className={cn(
                    "min-w-0 truncate",
                    l.status === "done" && "text-muted-foreground",
                    l.status === "locked" && "text-muted-foreground",
                    current && "font-semibold text-primary",
                  )}
                >
                  {l.title}
                </span>
                <span className="sr-only"> — {STATUS_WORD[l.status]}</span>
              </span>
            );
            return (
              <li key={l.id}>
                {l.status === "locked" ? (
                  <span className="flex min-h-9 items-center gap-2 px-2 py-1.5 opacity-70">
                    {row}
                  </span>
                ) : (
                  <a
                    href={lessonHref(l.id)}
                    aria-current={current ? "page" : undefined}
                    className={cn(
                      "flex min-h-9 items-center gap-2 px-2 py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                      current ? "bg-primary/10" : "hover:bg-accent/60",
                    )}
                  >
                    {row}
                  </a>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
}
