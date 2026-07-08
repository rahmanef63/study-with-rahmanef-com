"use client";
// roadmap slice — the connected course roadmap, drawn as a game-style QUEST TRAIL
// (deliberately unlike the syllabus list). DERIVES from the two queries the Kelas
// view already mounts (no new convex, no new tables): the module→lesson tree
// (courses.getOverview) + the completion set (progress.getCourseProgress). Each
// module is a "chapter" band; its lessons are stations on a two-tone progress spine
// (walked = success, ahead = muted). Member-gated: progress is only queried for
// members (anon sees a locked preview).
import { useMemo } from "react";
import type { Id } from "@convex/_generated/dataModel";
import { useCourseOverview } from "@/features/courses";
import { useCourseProgress, useMarkLessonComplete, toPercent } from "@/features/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Hero } from "@/components/mockup-kit";
import { RoadmapNode } from "../components/roadmap-node";
import type { RoadmapModule, RoadmapNodeStatus } from "../types";

export type CourseRoadmapProps = {
  tenantId: Id<"tenants">;
  courseSlug: string;
  /** Builds the in-window lesson href — the Kelas window intercepts #lesson/<id>. */
  lessonHref: (lessonId: string) => string;
};

const LEGEND: { cls: string; label: string }[] = [
  { cls: "bg-success", label: "Selesai" },
  { cls: "bg-primary", label: "Kamu di sini" },
  { cls: "border-2 border-primary/40 bg-card", label: "Terbuka" },
  { cls: "bg-muted", label: "Terkunci" },
];

export function CourseRoadmap({ tenantId, courseSlug, lessonHref }: CourseRoadmapProps) {
  const overview = useCourseOverview(tenantId, courseSlug);
  const isMember = overview?.viewerRole != null;
  const progress = useCourseProgress(isMember ? overview?.course._id : undefined);
  const { markComplete, isPending } = useMarkLessonComplete();

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
      const lessons = m.lessons.map((l) => ({
        id: l._id,
        title: l.title,
        hasVideo: l.hasVideo,
        status: statusOf(l._id),
      }));
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
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-[var(--radius-win)]" />
        ))}
      </div>
    );
  }

  const total = progress?.totalCount ?? overview.lessonCount;
  const completed = progress?.completedCount ?? 0;
  let step = 0; // running station number across the whole course

  return (
    <div className="space-y-6">
      <Hero
        eyebrow="Peta belajar"
        title={<>Roadmap · {overview.course.title}</>}
        description="Susuri jalurnya dari atas ke bawah — buka tiap stasiun, tandai selesai, dan lihat petamu terisi."
      >
        <div className="space-y-3">
          {isMember && total > 0 ? (
            <div className="max-w-md space-y-1.5">
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-success to-primary transition-all"
                  style={{ width: `${toPercent(completed, total)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {completed}/{total} stasiun terjelajahi · {toPercent(completed, total)}% peta terbuka
              </p>
            </div>
          ) : null}
          {/* Legend — makes the states self-explanatory */}
          <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
            {LEGEND.map((it) => (
              <li key={it.label} className="inline-flex items-center gap-1.5">
                <span className={`size-3 shrink-0 rounded-full ${it.cls}`} aria-hidden />
                {it.label}
              </li>
            ))}
          </ul>
        </div>
      </Hero>

      {groups.length === 0 ? (
        <p className="rounded-[var(--radius-win)] border border-dashed border-border bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
          Peta belajar sedang disiapkan 🌱
        </p>
      ) : (
        <div className="space-y-8">
          {groups.map((g, gi) => {
            const pct = g.total > 0 ? Math.round((g.doneCount / g.total) * 100) : 0;
            const chapterDone = g.total > 0 && g.doneCount === g.total;
            return (
              <section key={g.id} className="space-y-4">
                {/* Chapter "world" band */}
                <header className="flex items-center gap-3">
                  <span
                    className={`grid size-9 shrink-0 place-items-center rounded-full text-sm font-bold shadow-sm ${
                      chapterDone ? "bg-success text-success-foreground" : "bg-primary/10 text-primary"
                    }`}
                  >
                    {gi + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">
                      Chapter {gi + 1}
                    </p>
                    <h3 className="min-w-0 truncate font-serif text-lg font-medium leading-tight">{g.title}</h3>
                  </div>
                  <span className="shrink-0 rounded-full border border-border bg-card px-2.5 py-1 text-xs font-medium tabular-nums text-muted-foreground">
                    {g.doneCount}/{g.total}
                  </span>
                </header>

                {g.lessons.length === 0 ? (
                  <p className="pl-16 text-sm text-muted-foreground">Belum ada materi di chapter ini.</p>
                ) : (
                  <ol className="relative">
                    {/* Two-tone progress spine: walked (success) then unexplored (border).
                        left-6 (1.5rem) = center of the size-12 station circle. */}
                    <span
                      className="pointer-events-none absolute bottom-6 left-6 top-6 w-0.5 -translate-x-1/2"
                      style={{ backgroundImage: `linear-gradient(to bottom, var(--color-success) ${pct}%, var(--border) ${pct}%)` }}
                      aria-hidden
                    />
                    {g.lessons.map((l) => {
                      step += 1;
                      return (
                        <RoadmapNode
                          key={l.id}
                          lesson={l}
                          step={step}
                          href={lessonHref(l.id)}
                          onComplete={isMember && l.status !== "done" ? () => void markComplete(l.id) : undefined}
                          completing={isPending}
                        />
                      );
                    })}
                  </ol>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
