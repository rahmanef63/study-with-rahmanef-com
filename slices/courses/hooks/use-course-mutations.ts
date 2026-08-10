"use client";
// courses slice — course + PLACEMENT mutation hooks. Errors are caught here,
// mapped code → Bahasa Indonesia copy, surfaced via the shared toast
// (sonner) — never swallowed, never alert() (rr error-handling rules).
//
// The module writes are gone (DECISIONS #37): a course holds an ordered list
// of materi placements, so the editor adds/removes/reorders PLACEMENTS.
// Removing a materi from a course never deletes the materi — that is
// useLessonMutations().deleteLesson, deliberately a different verb.
import { useMutation } from "convex/react";
import { useCallback } from "react";
import { toast } from "sonner";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { mergeCopy, type CoursesCopyOverride } from "../config/copy";
import { coursesErrorMessage } from "../lib/errors";
import type { CourseStatus } from "../types";

export type CreateCourseInput = {
  tenantId: Id<"tenants">;
  slug: string;
  title: string;
  description: string;
  coverImageUrl?: string;
};

export type UpdateCourseInput = {
  courseId: Id<"courses">;
  slug?: string;
  title?: string;
  description?: string;
  coverImageUrl?: string | null;
};

/** Course-level writes. Each returns the id on success, null on error (toasted). */
export function useCourseMutations(copyOverride?: CoursesCopyOverride) {
  const copy = mergeCopy(copyOverride);
  const createRaw = useMutation(api.features.courses.courses.create);
  const updateRaw = useMutation(api.features.courses.courses.update);
  const setStatusRaw = useMutation(api.features.courses.courses.setStatus);

  const createCourse = useCallback(
    async (input: CreateCourseInput) => {
      try {
        return (await createRaw(input)) as Id<"courses">;
      } catch (error) {
        toast.error(coursesErrorMessage(error, copy));
        return null;
      }
    },
    [createRaw, copy]
  );

  const updateCourse = useCallback(
    async (input: UpdateCourseInput) => {
      try {
        return (await updateRaw(input)) as Id<"courses">;
      } catch (error) {
        toast.error(coursesErrorMessage(error, copy));
        return null;
      }
    },
    [updateRaw, copy]
  );

  const setCourseStatus = useCallback(
    async (courseId: Id<"courses">, status: CourseStatus) => {
      try {
        const id = (await setStatusRaw({ courseId, status })) as Id<"courses">;
        if (status === "published") toast.success(copy.publishSuccess);
        else if (status === "archived") toast.success(copy.archiveSuccess);
        return id;
      } catch (error) {
        toast.error(coursesErrorMessage(error, copy));
        return null;
      }
    },
    [setStatusRaw, copy]
  );

  return { createCourse, updateCourse, setCourseStatus };
}

/** Placement writes — which materi a course teaches, and in what order. */
export function usePlacementMutations(copyOverride?: CoursesCopyOverride) {
  const copy = mergeCopy(copyOverride);
  const addRaw = useMutation(api.features.courses.manage.addLessonToCourse);
  const removeRaw = useMutation(api.features.courses.manage.removeLessonFromCourse);
  const reorderRaw = useMutation(api.features.courses.manage.reorderCourseLessons);

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
    addLessonToCourse: (courseId: Id<"courses">, lessonId: Id<"lessons">) =>
      run(async () => {
        const res = await addRaw({ courseId, lessonId });
        toast.success(copy.addMateriSuccess);
        return res;
      }),
    /** Unplaces only — the materi stays in the tenant's library. */
    removeLessonFromCourse: (courseId: Id<"courses">, lessonId: Id<"lessons">) =>
      run(async () => {
        const res = await removeRaw({ courseId, lessonId });
        toast.success(copy.removeMateriSuccess);
        return res;
      }),
    reorderCourseLessons: (courseId: Id<"courses">, orderedLessonIds: Id<"lessons">[]) =>
      run(() => reorderRaw({ courseId, orderedLessonIds })),
  };
}
