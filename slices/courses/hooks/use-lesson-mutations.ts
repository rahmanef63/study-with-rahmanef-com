"use client";
// courses slice — lesson mutation hooks (same toast/error contract as
// use-course-mutations.ts). The YouTube ID is extracted from pasted URLs
// client-side as UX sugar; the SERVER re-validates the 11-char ID (P0).
import { useMutation } from "convex/react";
import { useCallback } from "react";
import { toast } from "sonner";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { mergeCopy, type CoursesCopyOverride } from "../config/copy";
import { coursesErrorMessage } from "../lib/errors";
import type { CourseLink } from "../types";

export type CreateLessonInput = {
  moduleId: Id<"modules">;
  title: string;
  contentMd: string;
  youtubeVideoId?: string;
  links: CourseLink[];
};

export type UpdateLessonInput = {
  lessonId: Id<"lessons">;
  title?: string;
  contentMd?: string;
  /** null clears the video; absent leaves it untouched. */
  youtubeVideoId?: string | null;
  links?: CourseLink[];
};

export function useLessonMutations(copyOverride?: CoursesCopyOverride) {
  const copy = mergeCopy(copyOverride);
  const createRaw = useMutation(api.features.courses.lessons.createLesson);
  const updateRaw = useMutation(api.features.courses.lessons.updateLesson);
  const reorderRaw = useMutation(api.features.courses.lessons.reorderLessons);
  const deleteRaw = useMutation(api.features.courses.lessons.deleteLesson);

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
    reorderLessons: (moduleId: Id<"modules">, orderedLessonIds: Id<"lessons">[]) =>
      run(() => reorderRaw({ moduleId, orderedLessonIds })),
    deleteLesson: (lessonId: Id<"lessons">) => run(() => deleteRaw({ lessonId })),
  };
}
