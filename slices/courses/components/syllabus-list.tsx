// courses slice — syllabus (modules → lessons) for the course overview.
// Progress (#3) consumes this through the barrel: pass `completedLessonIds`
// to render per-lesson check marks — no deep import needed.
import { CheckCircle2, Circle, Lock, PlayCircle } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import type { Id } from "@convex/_generated/dataModel";
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
      {modules.map((mod, moduleIndex) => (
        <section key={mod._id} className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground">
            {moduleIndex + 1}. {mod.title}
          </h3>
          <ul className="divide-y divide-border rounded-lg border border-border">
            {mod.lessons.map((lesson) => {
              const isDone = completed.has(lesson._id);
              const row = (
                <span className="flex items-center gap-3 p-3 text-sm">
                  {isDone ? (
                    <CheckCircle2 className="size-4 shrink-0 text-primary" aria-hidden />
                  ) : (
                    <Circle className="size-4 shrink-0 text-muted-foreground/50" aria-hidden />
                  )}
                  <span className="min-w-0 flex-1 truncate font-medium">{lesson.title}</span>
                  {lesson.hasVideo && (
                    <PlayCircle className="size-4 shrink-0 text-muted-foreground" aria-hidden />
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
                      className="block transition-colors hover:bg-muted/50"
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
      ))}
    </div>
  );
}
