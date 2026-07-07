"use client";
// courses slice — course + module mutation hooks. Errors are caught here,
// mapped code → Bahasa Indonesia copy, surfaced via the shared toast
// (sonner) — never swallowed, never alert() (rr error-handling rules).
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

/** Module-level writes (create/rename/reorder/delete). */
export function useModuleMutations(copyOverride?: CoursesCopyOverride) {
  const copy = mergeCopy(copyOverride);
  const createRaw = useMutation(api.features.courses.modules.createModule);
  const renameRaw = useMutation(api.features.courses.modules.renameModule);
  const reorderRaw = useMutation(api.features.courses.modules.reorderModules);
  const deleteRaw = useMutation(api.features.courses.modules.deleteModule);

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
    createModule: (courseId: Id<"courses">, title: string) =>
      run(() => createRaw({ courseId, title })),
    renameModule: (moduleId: Id<"modules">, title: string) =>
      run(() => renameRaw({ moduleId, title })),
    reorderModules: (courseId: Id<"courses">, orderedModuleIds: Id<"modules">[]) =>
      run(async () => {
        const res = await reorderRaw({ courseId, orderedModuleIds });
        toast.success(copy.reorderSuccess);
        return res;
      }),
    deleteModule: (moduleId: Id<"modules">) => run(() => deleteRaw({ moduleId })),
  };
}
