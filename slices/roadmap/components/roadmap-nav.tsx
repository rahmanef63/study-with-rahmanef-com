"use client";
// roadmap slice — the compact COURSE NAV rail. The secondary sidebar shown beside a
// lesson sheet: a flat grouped module→lesson list with the current lesson highlighted,
// so you can hop between lessons without leaving the sheet. Self-contained (derives
// from courses+progress); nav is plain #lesson/<id> anchors the Kelas window intercepts.
import { useMemo } from "react";
import { Check, ChevronLeft, Lock, Play } from "lucide-react";
import type { Id } from "@convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { useCourseOverview } from "@/features/courses";
import { useCourseProgress, toPercent } from "@/features/progress";
import { Skeleton } from "@/components/ui/skeleton";
import type { RoadmapModule, RoadmapNodeStatus } from "../types";

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
  /** In-window lesson href (the Kelas window turns #lesson/<id> into a nav). */
  lessonHref: (lessonId: string) => string;
  /** Back to the full course overview / map. */
  overviewHref: string;
  /** The lesson currently open in the sheet — highlighted in the rail. */
  currentLessonId?: string | null;
};

function StatusDot({ status, current }: { status: RoadmapNodeStatus; current: boolean }) {
  const base = "grid size-5 shrink-0 place-items-center rounded-full border";
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

  const groups: RoadmapModule[] = useMemo(() => {
    if (!overview) return [];
    const done = new Set<string>(progress?.completedLessonIds ?? []);
    const nextId = overview.modules.flatMap((m) => m.lessons).find((l) => !done.has(l._id))?._id ?? null;
    const statusOf = (id: Id<"lessons">): RoadmapNodeStatus => {
      if (!isMember) return "locked";
      if (done.has(id)) return "done";
      if (id === nextId) return "next";
      return "available";
    };
    return overview.modules.map((m) => {
      const lessons = m.lessons.map((l) => ({ id: l._id, title: l.title, hasVideo: l.hasVideo, status: statusOf(l._id) }));
      return {
        id: m._id,
        title: m.title,
        lessons,
        doneCount: lessons.filter((l) => l.status === "done").length,
        total: lessons.length,
      };
    });
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
      <p className="min-w-0 truncate font-serif text-base font-medium leading-tight">{overview.course.title}</p>
      {isMember && total > 0 && (
        <div className="space-y-1">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary" style={{ width: `${toPercent(completed, total)}%` }} />
          </div>
          <p className="text-[0.7rem] text-muted-foreground tabular-nums">
            {completed}/{total} selesai
          </p>
        </div>
      )}

      {/* Nav tree */}
      <nav aria-label="Daftar materi" className="flex flex-col gap-4">
        {groups.map((g, gi) => (
          <div key={g.id} className="space-y-1.5">
            <p className="flex items-center gap-1.5 text-[0.7rem] font-semibold uppercase tracking-wide text-muted-foreground">
              <span className="tabular-nums">{gi + 1}.</span>
              <span className="min-w-0 truncate">{g.title}</span>
            </p>
            <ul>
              {g.lessons.map((l) => {
                const current = l.id === currentLessonId;
                const row = (
                  <span className="flex min-w-0 flex-1 items-center gap-2">
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
                      <span className="flex items-center gap-2 rounded-md px-2 py-1.5 opacity-70">{row}</span>
                    ) : (
                      <a
                        href={lessonHref(l.id)}
                        aria-current={current ? "page" : undefined}
                        className={cn(
                          "flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          current ? "bg-primary/10" : "hover:bg-accent/60",
                        )}
                      >
                        {row}
                      </a>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </div>
  );
}
