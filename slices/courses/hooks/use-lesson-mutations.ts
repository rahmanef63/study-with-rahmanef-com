"use client";
// courses slice — MATERI mutation hooks (same toast/error contract as
// use-course-mutations.ts). The YouTube ID is extracted from pasted URLs
// client-side as UX sugar; the SERVER re-validates the 11-char ID (P0).
//
// A materi is created against a TENANT, in no course (DECISIONS #37).
// Placing it in a course is usePlacementMutations().addLessonToCourse, and
// reordering is per COURSE, not per materi — hence no reorderLessons here.
import { useMutation } from "convex/react";
import { useCallback } from "react";
import { toast } from "sonner";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { mergeCopy, type CoursesCopyOverride } from "../config/copy";
import { coursesErrorMessage } from "../lib/errors";
import type { CourseLink, LessonKind, MateriStatus } from "../types";

export type CreateLessonInput = {
  tenantId: Id<"tenants">;
  title: string;
  contentMd: string;
  /** Omitted → the server derives a tenant-unique slug from the title. */
  slug?: string;
  /** Omitted → "published"; a draft-by-default would hide new materi. */
  status?: MateriStatus;
  /**
   * Omitted → a plain materi, and the column is left UNWRITTEN — only a skill
   * declares itself, which is what keeps the skills library one exact index
   * range. Never send "materi".
   */
  kind?: LessonKind;
  /** Skills only; the server rejects a prompt on any other kind. */
  promptText?: string;
  youtubeVideoId?: string;
  links: CourseLink[];
};

export type UpdateLessonInput = {
  lessonId: Id<"lessons">;
  title?: string;
  slug?: string;
  contentMd?: string;
  /** null clears the prompt; absent leaves it untouched. `kind` is NOT
   *  updatable — flipping it would move a row between two libraries silently. */
  promptText?: string | null;
  /** null clears the video; absent leaves it untouched. */
  youtubeVideoId?: string | null;
  links?: CourseLink[];
};

export function useLessonMutations(copyOverride?: CoursesCopyOverride) {
  const copy = mergeCopy(copyOverride);
  const createRaw = useMutation(api.features.courses.lessons.createLesson);
  const updateRaw = useMutation(api.features.courses.lessons.updateLesson);
  const setStatusRaw = useMutation(api.features.courses.lessons.setLessonStatus);
  const deleteRaw = useMutation(api.features.courses.lessons.deleteLesson);
  // Tags live in the materi feature, but the WRITE path for a materi row is
  // this console (slices/materi's barrel says so in as many words: "hooks —
  // reads only; writes live in the manage console, features/courses"). Calling
  // its Convex function is not a cross-slice module import — the generated api
  // is shared — and it keeps one toast/error contract for the whole form.
  const setTagsRaw = useMutation(api.features.materi.tags.setTags);

  const run = useCallback(
    async <T,>(fn: () => Promise<T>): Promise<T | null> => {
      try {
        return await fn();
      } catch (error) {
        toast.error(coursesErrorMessage(error, copy));
        return null;
      }
    },
    [copy]
  );

  return {
    createLesson: (input: CreateLessonInput) =>
      run(() => createRaw(input) as Promise<Id<"lessons">>),
    updateLesson: (input: UpdateLessonInput) =>
      run(() => updateRaw(input) as Promise<Id<"lessons">>),
    /** Replace a materi's tags. Returns the stored (normalised) list, or null
     *  if the write failed — the caller must not assume its own list won. */
    setLessonTags: (lessonId: Id<"lessons">, tags: string[]) =>
      run(() => setTagsRaw({ lessonId, tags }) as Promise<string[]>),
    /** Publish/unpublish the materi itself — applies in EVERY course teaching it. */
    setLessonStatus: (lessonId: Id<"lessons">, status: MateriStatus) =>
      run(async () => {
        const id = await setStatusRaw({ lessonId, status });
        toast.success(status === "published" ? copy.materiPublished : copy.materiDrafted);
        return id;
      }),
    deleteLesson: (lessonId: Id<"lessons">) => run(() => deleteRaw({ lessonId })),
  };
}
