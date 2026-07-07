// courses slice — syllabus (modules → lessons) for the course overview.
// Progress (#3) consumes this through the barrel: pass `completedLessonIds`
// to render per-lesson check marks — no deep import needed.
import { CheckCircle2, ChevronRight, Circle, Lock, PlayCircle } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import type { Id } from "@convex/_generated/dataModel";
import { Badge } from "@/components/mockup-kit";
import type { SyllabusModuleData } from "../types";

export type SyllabusListProps = {
  modules: SyllabusModuleData[];
  /** Lesson route builder — e.g. (id) => `/t/${t}/kelas/${k}/belajar/${id}`. */
  lessonHref: (lessonId: Id<"lessons">) => string;
  /** From progress (#3): lesson ids the viewer completed. */
  completedLessonIds?: ReadonlyArray<string>;
  /** True for non-members: rows render inert with a lock hint (UX only). */
  locked?: boolean;
  emptyText: string;
  lockedText?: string;
  /** Optional slot rendered right after each module's lessons — e.g. that
   *  module's quiz CTA. Omitted callers are unaffected (backward-compatible). */
  renderModuleFooter?: (module: SyllabusModuleData) => ReactNode;
  className?: string;
};

export function SyllabusList({
  modules,
  lessonHref,
  completedLessonIds,
  locked = false,
  emptyText,
  lockedText,
  renderModuleFooter,
  className,
}: SyllabusListProps) {
  const completed = new Set(completedLessonIds ?? []);
  // Only surface per-module completion counts once the viewer's progress is
  // known (member branch passes the array; non-members leave it undefined).
  const showProgress = completedLessonIds !== undefined;
  const hasLessons = modules.some((mod) => mod.lessons.length > 0);

  if (!hasLessons) {
    // Still surface per-module footers (e.g. quiz CTAs) so they aren't lost on a
    // course whose modules have no lessons yet — the footer moved here from a
    // formerly-independent flat block.
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">{emptyText}</p>
        {renderModuleFooter
          ? modules.map((mod) => <div key={mod._id}>{renderModuleFooter(mod)}</div>)
          : null}
      </div>
    );
  }

  return (
    <div className={className ? `space-y-6 ${className}` : "space-y-6"}>
      {locked && lockedText !== undefined && (
        <p className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 p-3 text-sm text-muted-foreground">
          <Lock className="size-4 shrink-0" aria-hidden />
          {lockedText}
        </p>
      )}
      {modules.map((mod, moduleIndex) => {
        const moduleTotal = mod.lessons.length;
        const moduleDone = mod.lessons.reduce((n, l) => (completed.has(l._id) ? n + 1 : n), 0);
        return (
          <section key={mod._id} className="space-y-3">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <h3 className="flex min-w-0 items-baseline gap-2.5 font-serif text-base @sm:text-lg">
                <span className="tabular-nums text-primary/80">
                  {String(moduleIndex + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0 text-pretty">{mod.title}</span>
              </h3>
              {showProgress && moduleTotal > 0 ? (
                moduleDone === moduleTotal ? (
                  <Badge tone="success">Selesai ✓</Badge>
                ) : (
                  <Badge tone="muted">
                    {moduleDone}/{moduleTotal} lesson
                  </Badge>
                )
              ) : null}
            </div>
            <ul className="divide-y divide-border overflow-hidden rounded-[var(--radius-win)] border border-border bg-card">
              {mod.lessons.map((lesson) => {
                const isDone = completed.has(lesson._id);
                const row = (
                  <span className="flex min-h-11 items-center gap-3 px-4 py-3 text-sm">
                    {isDone ? (
                      <CheckCircle2 className="size-4 shrink-0 text-primary" aria-hidden />
                    ) : (
                      <Circle className="size-4 shrink-0 text-muted-foreground/40" aria-hidden />
                    )}
                    <span className="min-w-0 flex-1 truncate font-medium">{lesson.title}</span>
                    {lesson.hasVideo && (
                      <PlayCircle className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                    )}
                    {!locked && (
                      <ChevronRight
                        className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
                        aria-hidden
                      />
                    )}
                  </span>
                );
                return (
                  <li key={lesson._id}>
                    {locked ? (
                      <span className="block cursor-not-allowed opacity-60">{row}</span>
                    ) : (
                      <Link
                        href={lessonHref(lesson._id)}
                        className="group block transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                      >
                        {row}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
            {renderModuleFooter?.(mod)}
          </section>
        );
      })}
    </div>
  );
}
