"use client";
// courses slice — the course editor's materi list: one row per PLACEMENT
// (DECISIONS #37). Same iOS inset grouped list as the learner-facing silabus,
// with the instructor controls on the row: move ▲▼, edit the materi, publish
// toggle, and "keluarkan dari kelas" — which unplaces, never deletes.
//
// There is no module column any more: a course is a flat ordered list.
import { ChevronDown, ChevronUp, Eye, EyeOff, Link2, Minus, Pencil, PlayCircle } from "lucide-react";
import type { Id } from "@convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import type { CoursesCopy } from "../../config/copy";
import type { ManagePlacementRow, MateriStatus } from "../../types";

export type PlacementListProps = {
  lessons: ManagePlacementRow[];
  copy: CoursesCopy;
  onMove: (lessonId: Id<"lessons">, direction: -1 | 1) => void;
  onEdit: (lessonId: Id<"lessons">) => void;
  onSetStatus: (lessonId: Id<"lessons">, status: MateriStatus) => void;
  onRemove: (lessonId: Id<"lessons">) => void;
  /** True while a reorder is in flight — freezes ▲▼ so rapid clicks cannot
   *  race concurrent reorders off stale ordering. */
  reorderDisabled?: boolean;
};

const GROUP = "-mx-4 border-y border-border bg-card @sm:mx-0 @sm:border-x";
// 44px tap target on phones, compact from @sm (editorial density).
const ICON_BTN = "size-11 @sm:size-9";

export function PlacementList({
  lessons,
  copy,
  onMove,
  onEdit,
  onSetStatus,
  onRemove,
  reorderDisabled = false,
}: PlacementListProps) {
  if (lessons.length === 0) {
    return <p className="text-sm text-muted-foreground">{copy.emptySyllabus}</p>;
  }

  return (
    <>
    <ol className={`${GROUP} divide-y divide-border`}>
      {lessons.map((lesson, index) => {
        const isDraft = lesson.status === "draft";
        return (
          <li
            key={lesson.placementId}
            className="flex flex-col gap-1 px-4 py-2.5 @sm:flex-row @sm:items-center @sm:gap-3"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="w-6 shrink-0 text-right font-display text-[0.65rem] tabular-nums text-muted-foreground">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{lesson.title}</span>
              {isDraft && (
                <span className="shrink-0 border border-border bg-muted px-1.5 py-0.5 text-[0.65rem] uppercase tracking-wide text-muted-foreground">
                  {copy.statusDraft}
                </span>
              )}
              {lesson.hasVideo && (
                <PlayCircle className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              )}
              {lesson.linkCount > 0 && (
                <span className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                  <Link2 className="size-3.5" aria-hidden /> {lesson.linkCount}
                </span>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-0.5 @sm:ml-auto @sm:gap-1">
              <Button
                variant="ghost"
                size="icon"
                className={ICON_BTN}
                aria-label={`${copy.moveUp} — ${lesson.title}`}
                disabled={index === 0 || reorderDisabled}
                onClick={() => onMove(lesson._id, -1)}
              >
                <ChevronUp aria-hidden />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={ICON_BTN}
                aria-label={`${copy.moveDown} — ${lesson.title}`}
                disabled={index === lessons.length - 1 || reorderDisabled}
                onClick={() => onMove(lesson._id, 1)}
              >
                <ChevronDown aria-hidden />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={ICON_BTN}
                aria-label={`${isDraft ? copy.publish : copy.unpublish} — ${lesson.title}`}
                onClick={() => onSetStatus(lesson._id, isDraft ? "published" : "draft")}
              >
                {isDraft ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={ICON_BTN}
                aria-label={`${copy.editLesson} — ${lesson.title}`}
                onClick={() => onEdit(lesson._id)}
              >
                <Pencil aria-hidden />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={ICON_BTN}
                aria-label={`${copy.removeMateri} — ${lesson.title}`}
                onClick={() => onRemove(lesson._id)}
              >
                {/* MINUS, not an X or a bin: this unplaces a materi, and the
                    picker below adds one back with a PLUS. The pair reads as
                    one reversible operation; a bin would promise deletion the
                    button does not perform. */}
                <Minus aria-hidden />
              </Button>
            </div>
          </li>
        );
      })}
    </ol>
    {/* Said on the LIST, not only inside the confirm dialog: an instructor
        weighing whether to touch the − button decides before the dialog opens,
        and a materi taught in two courses must never look one click from
        deletion. */}
    <p className="px-4 text-xs text-pretty text-muted-foreground @sm:px-0">
      {copy.removeMateri}: {copy.removeMateriConfirm}
    </p>
    </>
  );
}
