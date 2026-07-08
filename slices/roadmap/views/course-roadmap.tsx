"use client";
// roadmap slice — the connected course roadmap. DERIVES from the two queries the
// Kelas view already mounts (no new convex, no new tables): the module→lesson tree
// (courses.getOverview) + the completion set (progress.getCourseProgress). Maps
// them to a learning path with per-step status. Member-gated: progress is only
// queried when the viewer is a member (anon sees a locked preview).
import { useMemo } from "react";
import type { Id } from "@convex/_generated/dataModel";
import { useCourseOverview } from "@/features/courses";
import { useCourseProgress, useMarkLessonComplete, toPercent } from "@/features/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Hero, Badge } from "@/components/mockup-kit";
import { RoadmapNode } from "../components/roadmap-node";
import type { RoadmapModule, RoadmapNodeStatus } from "../types";

export type CourseRoadmapProps = {
  tenantId: Id<"tenants">;
  courseSlug: string;
  /** Builds the in-window lesson href — the Kelas window intercepts #lesson/<id>. */
  lessonHref: (lessonId: string) => string;
};

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

  return (
    <div className="space-y-6">
      <Hero
        eyebrow="Peta belajar"
        title={<>Roadmap · {overview.course.title}</>}
        description="Ikuti jalurnya dari atas ke bawah — tiap langkah membuka materinya."
      >
        {isMember && total > 0 ? (
          <div className="max-w-md space-y-1.5">
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${toPercent(completed, total)}%` }} />
            </div>
            <p className="text-xs text-muted-foreground">{completed}/{total} langkah selesai</p>
          </div>
        ) : null}
      </Hero>

      {groups.length === 0 ? (
        <p className="rounded-[var(--radius-win)] border border-dashed border-border bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
          Roadmap sedang disiapkan 🌱
        </p>
      ) : (
        <div className="space-y-6">
          {groups.map((g, gi) => (
            <section key={g.id} className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {gi + 1}
                </span>
                <h3 className="min-w-0 flex-1 truncate font-serif text-lg font-medium">{g.title}</h3>
                <Badge tone={g.total > 0 && g.doneCount === g.total ? "success" : "muted"}>
                  {g.doneCount}/{g.total}
                </Badge>
              </div>
              <div className="space-y-2 border-l-2 border-dashed border-border pl-4">
                {g.lessons.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Belum ada materi di modul ini.</p>
                ) : (
                  g.lessons.map((l) => (
                    <RoadmapNode
                      key={l.id}
                      lesson={l}
                      href={lessonHref(l.id)}
                      onComplete={isMember && l.status !== "done" ? () => void markComplete(l.id) : undefined}
                      completing={isPending}
                    />
                  ))
                )}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
