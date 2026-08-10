"use client";
// courses slice — create/edit dialog for ONE materi row, in either kind.
//
// MATERI (default). Create mode takes a TENANT, not a module (DECISIONS #37):
// the materi is authored into the community's library. Placing it in the course
// that opened this dialog is a SEPARATE call, reported back through `onCreated`
// so the placement stays the caller's concern.
//
// SKILL (`kind="skill"`). Same row, same mutations, plus a prompt and tags.
// Three things are deliberately different:
//   · `kind: "skill"` is written ONLY on create. The server refuses to change a
//     row's kind, so the edit path never sends it — a skill cannot silently
//     become a materi (or vice versa) from this dialog.
//   · the prompt is read back with `materi.skills.getPrompt`, not with
//     `getLessonForManage`: that projection belongs to another slice's manage
//     surface and does not carry promptText. One extra id-keyed query, no
//     duplicated projection.
//   · EDIT never sends contentMd (DECISIONS #38 — once the block editor owns
//     `contentBlocks`, markdown is derived and updateLesson rejects the patch).
//     `contentEditorHref` sends the author to the editor instead.
import type { Id } from "@convex/_generated/dataModel";
import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";
import Link from "next/link";
import { useState } from "react";
import { SquarePen } from "lucide-react";
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/features/responsive-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import type { CoursesCopy } from "../../config/copy";
import { useLessonForManage } from "../../hooks/use-courses";
import { useLessonMutations } from "../../hooks/use-lesson-mutations";
import type { LessonKind } from "../../types";
import { LessonForm, type LessonFormValues } from "./lesson-form";

export type LessonDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Create mode: the community the materi is authored into. */
  tenantId?: Id<"tenants">;
  /** Edit mode: existing materi. */
  lessonId?: Id<"lessons">;
  /** Called with the new row's id after a successful create. */
  onCreated?: (lessonId: Id<"lessons">) => void;
  copy: CoursesCopy;
  /** Defaults to "materi". Only the skills console passes "skill". */
  kind?: LessonKind;
  /** Skill edit: tags already on the row (the list row carries them, so the
   *  dialog does not re-query). Absent = start empty. */
  initialTags?: string[];
  /** Skill edit: where the block editor for this row lives. */
  contentEditorHref?: string;
};

export function LessonDialog({
  open,
  onOpenChange,
  tenantId,
  lessonId,
  onCreated,
  copy,
  kind = "materi",
  initialTags,
  contentEditorHref,
}: LessonDialogProps) {
  const isEdit = lessonId !== undefined;
  const isSkill = kind === "skill";
  const existing = useLessonForManage(open && isEdit ? lessonId : undefined);
  const prompt = useQuery(
    api.features.materi.skills.getPrompt,
    open && isEdit && isSkill && lessonId !== undefined ? { lessonId } : "skip"
  );
  const { createLesson, updateLesson, setLessonTags } = useLessonMutations();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (values: LessonFormValues) => {
    setSubmitting(true);
    try {
      if (isEdit && lessonId !== undefined) {
        const hadVideo = existing?.youtubeVideoId !== undefined;
        const result = await updateLesson({
          lessonId,
          title: values.title,
          // Skill: the block editor owns the body (see the header note).
          contentMd: isSkill ? undefined : values.contentMd,
          links: isSkill ? undefined : values.links,
          promptText: isSkill ? values.promptText : undefined,
          youtubeVideoId: isSkill ? undefined : (values.youtubeVideoId ?? (hadVideo ? null : undefined)),
        });
        if (result === null) return;
        // Sent even when unchanged: the server diffs, and an unconditional
        // write is what makes REMOVING the last tag work.
        if (isSkill && (await setLessonTags(lessonId, values.tags ?? [])) === null) return;
        onOpenChange(false);
      } else if (tenantId !== undefined) {
        const result = await createLesson({
          tenantId,
          title: values.title,
          contentMd: values.contentMd,
          // Only a skill declares its kind; a materi leaves the column unwritten.
          kind: isSkill ? "skill" : undefined,
          promptText: isSkill ? values.promptText : undefined,
          youtubeVideoId: values.youtubeVideoId,
          links: values.links,
        });
        if (result === null) return;
        if (isSkill && (values.tags?.length ?? 0) > 0) {
          await setLessonTags(result, values.tags ?? []);
        }
        onCreated?.(result);
        onOpenChange(false);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const loading = isEdit && (existing === undefined || (isSkill && prompt === undefined));
  const title = isSkill
    ? isEdit
      ? copy.editSkill
      : copy.newSkill
    : isEdit
      ? copy.editLesson
      : copy.newLesson;

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange} size="lg">
      <ResponsiveDialogHeader>
        <ResponsiveDialogTitle>{title}</ResponsiveDialogTitle>
      </ResponsiveDialogHeader>
      <ResponsiveDialogBody>
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : (
          <LessonForm
            key={isEdit ? lessonId : `create-${kind}`}
            kind={kind}
            // A skill's body is the block editor's from the moment it exists.
            bodyEditable={!isSkill || !isEdit}
            bodySlot={
              isSkill && isEdit && contentEditorHref !== undefined ? (
                <Link
                  href={contentEditorHref}
                  className="inline-flex min-h-11 items-center gap-2 text-sm underline underline-offset-4 hover:text-primary"
                >
                  <SquarePen className="size-4" aria-hidden /> {copy.openContentEditor}
                </Link>
              ) : undefined
            }
            initial={
              isEdit && existing !== undefined
                ? {
                    title: existing.title,
                    contentMd: existing.contentMd,
                    youtubeVideoId: existing.youtubeVideoId,
                    links: existing.links,
                    promptText: prompt?.promptText ?? "",
                    tags: initialTags ?? [],
                  }
                : undefined
            }
            onSubmit={handleSubmit}
            submitting={submitting}
            copy={copy}
          />
        )}
      </ResponsiveDialogBody>
    </ResponsiveDialog>
  );
}
