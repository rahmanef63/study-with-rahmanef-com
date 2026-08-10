"use client";

// Kelola › Skills — one row. Presentational: every action is a callback, the
// data comes from `listLibrary({ kind: "skill" })` (title, prompt preview,
// tags) crossed with the manage list (status).
//
// The row leads with a SKILL badge and the prompt preview in monospace,
// because those two are what tell an author, at a glance, that this is a
// prompt and not a materi.
import Link from "next/link";
import { Pencil, Sparkles, SquarePen, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CoursesCopy, MateriStatus } from "@/features/courses";

export type SkillRowData = {
  _id: string;
  title: string;
  promptPreview: string | null;
  tags: string[];
  courseCount: number;
};

export function KelolaSkillRow({
  skill,
  status,
  contentEditorHref,
  copy,
  onEdit,
  onToggleStatus,
  onDelete,
}: {
  skill: SkillRowData;
  /** undefined while the status list is still loading. */
  status: MateriStatus | undefined;
  contentEditorHref: string;
  copy: CoursesCopy;
  onEdit: () => void;
  onToggleStatus: (next: MateriStatus) => void;
  onDelete: () => void;
}) {
  const isDraft = status === "draft";
  return (
    <div className="space-y-3 border border-border bg-card p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 border border-primary/40 bg-primary/10 px-2 py-0.5 text-[0.65rem] uppercase tracking-wide text-primary">
          <Sparkles className="size-3" aria-hidden /> {copy.skillLabel}
        </span>
        {status !== undefined && (
          <span
            className={`border px-2 py-0.5 text-[0.65rem] uppercase tracking-wide ${
              isDraft
                ? "border-border bg-muted text-muted-foreground"
                : "border-primary/20 bg-primary/5 text-primary"
            }`}
          >
            {isDraft ? copy.statusDraft : copy.statusPublished}
          </span>
        )}
      </div>

      <h4 className="min-w-0 break-words text-base font-medium">{skill.title}</h4>

      <p
        className={`line-clamp-2 whitespace-pre-wrap break-words font-mono text-xs leading-relaxed ${
          skill.promptPreview === null ? "text-destructive" : "text-muted-foreground"
        }`}
      >
        {skill.promptPreview ?? copy.skillNoPrompt}
      </p>

      {skill.tags.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {skill.tags.map((tag) => (
            <li
              key={tag}
              className="border border-border bg-muted px-1.5 py-0.5 font-mono text-[0.65rem] text-muted-foreground"
            >
              {tag}
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" className="min-h-11 @sm:min-h-9" onClick={onEdit}>
          <Pencil aria-hidden /> {copy.editSkill}
        </Button>
        <Button asChild variant="outline" size="sm" className="min-h-11 @sm:min-h-9">
          <Link href={contentEditorHref}>
            <SquarePen aria-hidden /> {copy.openContentEditor}
          </Link>
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="min-h-11 @sm:min-h-9"
          disabled={status === undefined}
          onClick={() => onToggleStatus(isDraft ? "published" : "draft")}
        >
          {isDraft ? copy.publish : copy.unpublish}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="min-h-11 text-destructive hover:text-destructive @sm:min-h-9"
          onClick={onDelete}
        >
          <Trash2 aria-hidden /> {copy.deleteSkill}
        </Button>
      </div>
    </div>
  );
}
