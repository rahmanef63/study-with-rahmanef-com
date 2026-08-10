// courses slice — the silabus: a FLAT ordered list of materi (DECISIONS #37).
// The module grouping is gone, so this is no longer a stack of sections —
// it is ONE list, and it is rendered as an iOS inset grouped list: full-bleed
// rows separated by hairlines on a phone, inset inside its own frame from
// @sm up. A card per materi would have cost ~3× the vertical rhythm and made
// a 20-materi course an endless scroll of boxes.
//
// Progress (#3) consumes this through the barrel: pass `completedLessonIds`
// to render per-materi check marks — no deep import needed.
//
// The `-mx-4` bleed assumes the host gutter is 1rem on phones (the community
// shell is `px-4`). From @sm the list insets itself and grows side borders.
import { CheckCircle2, ChevronRight, Circle, Lock, PlayCircle } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import type { Id } from "@convex/_generated/dataModel";
import type { SyllabusLessonData } from "../types";

export type SyllabusListProps = {
  lessons: SyllabusLessonData[];
  /** Materi route builder — e.g. (id) => `/k/${t}/kelas/${k}/${id}`. */
  lessonHref: (lessonId: Id<"lessons">) => string;
  /** From progress (#3): materi ids the viewer completed. */
  completedLessonIds?: ReadonlyArray<string>;
  /** True for non-members: rows render inert with a lock hint (UX only). */
  locked?: boolean;
  emptyText: string;
  lockedText?: string;
  /** Rendered as the last rows of the same list — e.g. the course's quizzes.
   *  Kept inside the frame so a quiz reads as a step of the course, not a
   *  detached card floating under it. MUST render `<li>` elements: it is
   *  spliced into this component's `<ol>`. */
  footerSlot?: ReactNode;
  className?: string;
};

/** Full-bleed on a phone, inset grouped from @sm — one frame, hairline rows. */
const GROUP = "-mx-4 border-y border-border bg-card @sm:mx-0 @sm:border-x";
const ROW = "flex min-h-12 items-center gap-3 px-4 py-2.5 text-sm @sm:min-h-11";

export function SyllabusList({
  lessons,
  lessonHref,
  completedLessonIds,
  locked = false,
  emptyText,
  lockedText,
  footerSlot,
  className,
}: SyllabusListProps) {
  const completed = new Set(completedLessonIds ?? []);

  if (lessons.length === 0) {
    // Still surface the footer (quizzes) — a course can be quiz-first while
    // its silabus is still being written.
    return (
      <div className={className ? `space-y-3 ${className}` : "space-y-3"}>
        <p className="text-sm text-muted-foreground">{emptyText}</p>
        {footerSlot}
      </div>
    );
  }

  return (
    <div className={className ? `space-y-3 ${className}` : "space-y-3"}>
      {locked && lockedText !== undefined && (
        <p className="flex items-center gap-2 border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
          <Lock className="size-4 shrink-0" aria-hidden />
          {lockedText}
        </p>
      )}
      <ol className={`${GROUP} divide-y divide-border`}>
        {lessons.map((lesson, index) => {
          const isDone = completed.has(lesson._id);
          const row = (
            <span className={ROW}>
              <span className="w-6 shrink-0 text-right font-display text-[0.65rem] tabular-nums text-muted-foreground">
                {String(index + 1).padStart(2, "0")}
              </span>
              {isDone ? (
                <CheckCircle2 className="size-4 shrink-0 text-success" aria-hidden />
              ) : (
                <Circle className="size-4 shrink-0 text-muted-foreground/40" aria-hidden />
              )}
              <span className="min-w-0 flex-1 truncate font-medium">{lesson.title}</span>
              {lesson.hasVideo && (
                <PlayCircle className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              )}
              {!locked && (
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
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
                  className="block transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                >
                  {row}
                </Link>
              )}
            </li>
          );
        })}
        {footerSlot}
      </ol>
    </div>
  );
}
