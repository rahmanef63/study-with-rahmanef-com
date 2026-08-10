"use client";
// courses slice — create/edit MATERI dialog. Edit mode loads the full materi
// (incl. contentMd) via getLessonForManage; clearing the video in edit mode
// submits youtubeVideoId: null (server removes the field).
//
// Create mode takes a TENANT, not a module (DECISIONS #37): the materi is
// authored into the community's library. Placing it in the course that opened
// this dialog is a SEPARATE call, reported back through `onCreated` so the
// placement stays the caller's concern (the dialog also serves the library,
// where there is no course to place into).
import type { Id } from "@convex/_generated/dataModel";
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/features/responsive-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import type { CoursesCopy } from "../../config/copy";
import { useLessonForManage } from "../../hooks/use-courses";
import { useLessonMutations } from "../../hooks/use-lesson-mutations";
import { LessonForm, type LessonFormValues } from "./lesson-form";

export type LessonDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Create mode: the community the materi is authored into. */
  tenantId?: Id<"tenants">;
  /** Edit mode: existing materi. */
  lessonId?: Id<"lessons">;
  /** Called with the new materi's id after a successful create. */
  onCreated?: (lessonId: Id<"lessons">) => void;
  copy: CoursesCopy;
};

export function LessonDialog({
  open,
  onOpenChange,
  tenantId,
  lessonId,
  onCreated,
  copy,
}: LessonDialogProps) {
  const isEdit = lessonId !== undefined;
  const existing = useLessonForManage(open && isEdit ? lessonId : undefined);
  const { createLesson, updateLesson } = useLessonMutations();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (values: LessonFormValues) => {
    setSubmitting(true);
    try {
      if (isEdit && lessonId !== undefined) {
        const hadVideo = existing?.youtubeVideoId !== undefined;
        const result = await updateLesson({
          lessonId,
          title: values.title,
          contentMd: values.contentMd,
          links: values.links,
          youtubeVideoId: values.youtubeVideoId ?? (hadVideo ? null : undefined),
        });
        if (result !== null) onOpenChange(false);
      } else if (tenantId !== undefined) {
        const result = await createLesson({
          tenantId,
          title: values.title,
          contentMd: values.contentMd,
          youtubeVideoId: values.youtubeVideoId,
          links: values.links,
        });
        if (result !== null) {
          onCreated?.(result);
          onOpenChange(false);
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  const loading = isEdit && existing === undefined;

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange} size="lg">
      <ResponsiveDialogHeader>
        <ResponsiveDialogTitle>{isEdit ? copy.editLesson : copy.newLesson}</ResponsiveDialogTitle>
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
            key={isEdit ? lessonId : "create"}
            initial={
              isEdit && existing !== undefined
                ? {
                    title: existing.title,
                    contentMd: existing.contentMd,
                    youtubeVideoId: existing.youtubeVideoId,
                    links: existing.links,
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
