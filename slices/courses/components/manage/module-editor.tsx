"use client";
// courses slice — one module card in the course editor: rename inline,
// move up/down (parent owns reorder), delete (only when empty — server
// enforces), lesson rows with edit/delete/move controls.
import { ChevronDown, ChevronUp, Link2, Pencil, PlayCircle, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import type { Id } from "@convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { CoursesCopy } from "../../config/copy";
import type { ManageModuleRow } from "../../types";

export type ModuleEditorProps = {
  module: ManageModuleRow;
  index: number;
  total: number;
  copy: CoursesCopy;
  onRename: (moduleId: Id<"modules">, title: string) => Promise<unknown>;
  onMove: (moduleId: Id<"modules">, direction: -1 | 1) => void;
  onDelete: (moduleId: Id<"modules">) => void;
  onAddLesson: (moduleId: Id<"modules">) => void;
  onEditLesson: (lessonId: Id<"lessons">) => void;
  onDeleteLesson: (lessonId: Id<"lessons">) => void;
  onMoveLesson: (moduleId: Id<"modules">, lessonId: Id<"lessons">, direction: -1 | 1) => void;
  /** True while any reorder is in flight — freezes the ▲▼ controls so
   *  rapid clicks can't race concurrent reorders off stale ordering. */
  reorderDisabled?: boolean;
};

export function ModuleEditor({
  module: mod,
  index,
  total,
  copy,
  onRename,
  onMove,
  onDelete,
  onAddLesson,
  onEditLesson,
  onDeleteLesson,
  onMoveLesson,
  reorderDisabled = false,
}: ModuleEditorProps) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(mod.title);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2 space-y-0">
        {editing ? (
          <form
            className="flex flex-1 items-center gap-2"
            onSubmit={async (e) => {
              e.preventDefault();
              await onRename(mod._id, title.trim());
              setEditing(false);
            }}
          >
            <Input value={title} onChange={(e) => setTitle(e.target.value)} minLength={3} maxLength={120} required />
            <Button type="submit" size="sm">{copy.save}</Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => { setTitle(mod.title); setEditing(false); }}>
              {copy.cancel}
            </Button>
          </form>
        ) : (
          <>
            <div className="flex min-w-0 flex-1 flex-col">
              <h3 className="truncate font-semibold">
                {index + 1}. {mod.title}
              </h3>
              <p className="text-xs text-muted-foreground">
                {mod.lessons.length === 0 ? "Belum ada lesson" : `${mod.lessons.length} lesson`}
              </p>
            </div>
            <Button variant="ghost" size="icon" aria-label={copy.renameModule} onClick={() => setEditing(true)}>
              <Pencil aria-hidden />
            </Button>
            <Button variant="ghost" size="icon" aria-label={copy.moveUp} disabled={index === 0 || reorderDisabled} onClick={() => onMove(mod._id, -1)}>
              <ChevronUp aria-hidden />
            </Button>
            <Button variant="ghost" size="icon" aria-label={copy.moveDown} disabled={index === total - 1 || reorderDisabled} onClick={() => onMove(mod._id, 1)}>
              <ChevronDown aria-hidden />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label={copy.deleteModule}
              disabled={mod.lessons.length > 0}
              onClick={() => onDelete(mod._id)}
            >
              <Trash2 aria-hidden />
            </Button>
          </>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        {/* lessons nest under the module: tinted panel */}
        <ul className="divide-y divide-border rounded-lg border border-border bg-muted/20">
          {mod.lessons.map((lesson, lessonIndex) => (
            <li key={lesson._id} className="flex items-center gap-2 p-2 text-sm">
              <span className="min-w-0 flex-1 truncate font-medium">{lesson.title}</span>
              {lesson.hasVideo && <PlayCircle className="size-4 shrink-0 text-muted-foreground" aria-hidden />}
              {lesson.linkCount > 0 && (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Link2 className="size-3.5" aria-hidden /> {lesson.linkCount}
                </span>
              )}
              <Button variant="ghost" size="icon" aria-label={`${copy.moveUp} — ${lesson.title}`} disabled={lessonIndex === 0 || reorderDisabled} onClick={() => onMoveLesson(mod._id, lesson._id, -1)}>
                <ChevronUp aria-hidden />
              </Button>
              <Button variant="ghost" size="icon" aria-label={`${copy.moveDown} — ${lesson.title}`} disabled={lessonIndex === mod.lessons.length - 1 || reorderDisabled} onClick={() => onMoveLesson(mod._id, lesson._id, 1)}>
                <ChevronDown aria-hidden />
              </Button>
              <Button variant="ghost" size="icon" aria-label={`${copy.editLesson} — ${lesson.title}`} onClick={() => onEditLesson(lesson._id)}>
                <Pencil aria-hidden />
              </Button>
              <Button variant="ghost" size="icon" aria-label={`${copy.deleteLesson} — ${lesson.title}`} onClick={() => onDeleteLesson(lesson._id)}>
                <Trash2 aria-hidden />
              </Button>
            </li>
          ))}
          {mod.lessons.length === 0 && (
            <li className="px-3 py-4 text-center text-sm text-muted-foreground">{copy.emptySyllabus}</li>
          )}
        </ul>
        <Button variant="outline" size="sm" onClick={() => onAddLesson(mod._id)}>
          <Plus aria-hidden /> {copy.newLesson}
        </Button>
      </CardContent>
    </Card>
  );
}
