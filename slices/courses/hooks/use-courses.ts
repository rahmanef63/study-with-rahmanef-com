"use client";
// courses slice — read hooks (reactive client state per rr data-fetching
// rules; never fetch in useEffect). Returns are cast to the slice's
// projection types (the generated api.d.ts types are structurally identical;
// the cast keeps the slice's own vocabulary at the boundary).
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import type {
  CourseCardData,
  CourseManageData,
  CourseOverviewData,
  LessonEditorData,
  LessonViewData,
  ManageCourseRow,
  MateriPickerRow,
} from "../types";

/** Published courses of a tenant (public etalase — landing #5, tenant home). */
export function usePublishedCourses(tenantId: Id<"tenants"> | undefined) {
  return useQuery(
    api.features.courses.queries.listPublished,
    tenantId === undefined ? "skip" : { tenantId }
  ) as CourseCardData[] | undefined;
}

/** Course overview + FLAT silabus (public for published; NOT_FOUND for drafts). */
export function useCourseOverview(
  tenantId: Id<"tenants"> | undefined,
  courseSlug: string | undefined
) {
  return useQuery(
    api.features.courses.queries.getOverview,
    tenantId === undefined || courseSlug === undefined ? "skip" : { tenantId, courseSlug }
  ) as CourseOverviewData | undefined;
}

/**
 * Full materi content — member-only (throws to the route error boundary).
 * `courseId` is READING CONTEXT: it picks which course's prev/next path the
 * server walks. Omit it for the canonical /materi route.
 */
export function useLesson(
  lessonId: Id<"lessons"> | undefined,
  courseId?: Id<"courses"> | null
) {
  return useQuery(
    api.features.courses.queries.getLesson,
    lessonId === undefined
      ? "skip"
      : courseId == null
        ? { lessonId }
        : { lessonId, courseId }
  ) as LessonViewData | undefined;
}

/** Manage table rows, all statuses — instructor+. */
export function useManageCourses(tenantId: Id<"tenants"> | undefined) {
  return useQuery(
    api.features.courses.manage.listForManage,
    tenantId === undefined ? "skip" : { tenantId }
  ) as ManageCourseRow[] | undefined;
}

/** Course + its ordered PLACEMENTS for the editor — instructor+. */
export function useCourseForManage(courseId: Id<"courses"> | undefined) {
  return useQuery(
    api.features.courses.manage.getCourseForManage,
    courseId === undefined ? "skip" : { courseId }
  ) as CourseManageData | undefined;
}

/** Every materi of the tenant, any status — the "tambah materi" picker. */
export function useMateriForManage(tenantId: Id<"tenants"> | undefined) {
  return useQuery(
    api.features.courses.manage.listMateriForManage,
    tenantId === undefined ? "skip" : { tenantId }
  ) as MateriPickerRow[] | undefined;
}

/** Full materi for the materi editor — instructor+. */
export function useLessonForManage(lessonId: Id<"lessons"> | undefined) {
  return useQuery(
    api.features.courses.manage.getLessonForManage,
    lessonId === undefined ? "skip" : { lessonId }
  ) as LessonEditorData | undefined;
}
