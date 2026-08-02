"use client";
// courses slice — read hooks (reactive client state per rr data-fetching
// rules; never fetch in useEffect). Returns are cast to the slice's
// projection types — api.d.ts is untyped until `npx convex dev` regenerates
// it (see docs/STATUS.md row #0 note); casts stay valid after codegen.
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import type {
  CourseCardData,
  CourseOverviewData,
  CourseTreeData,
  LessonEditorData,
  LessonViewData,
  ManageCourseRow,
} from "../types";

/** Published courses of a tenant (public etalase — landing #5, tenant home). */
export function usePublishedCourses(tenantId: Id<"tenants"> | undefined) {
  return useQuery(
    api.features.courses.queries.listPublished,
    tenantId === undefined ? "skip" : { tenantId }
  ) as CourseCardData[] | undefined;
}

/** Course overview + syllabus (public for published; NOT_FOUND for drafts). */
export function useCourseOverview(
  tenantId: Id<"tenants"> | undefined,
  courseSlug: string | undefined
) {
  return useQuery(
    api.features.courses.queries.getOverview,
    tenantId === undefined || courseSlug === undefined ? "skip" : { tenantId, courseSlug }
  ) as CourseOverviewData | undefined;
}

/** Full lesson content — member-only (throws to the route error boundary). */
export function useLesson(lessonId: Id<"lessons"> | undefined) {
  return useQuery(
    api.features.courses.queries.getLesson,
    lessonId === undefined ? "skip" : { lessonId }
  ) as LessonViewData | undefined;
}

/** Manage table rows, all statuses — instructor+. */
export function useManageCourses(tenantId: Id<"tenants"> | undefined) {
  return useQuery(
    api.features.courses.manage.listForManage,
    tenantId === undefined ? "skip" : { tenantId }
  ) as ManageCourseRow[] | undefined;
}

/** Course tree for the editor — instructor+. */
export function useCourseTree(courseId: Id<"courses"> | undefined) {
  return useQuery(
    api.features.courses.manage.getCourseTree,
    courseId === undefined ? "skip" : { courseId }
  ) as CourseTreeData | undefined;
}

/** Full lesson for the lesson editor — instructor+. */
export function useLessonForManage(lessonId: Id<"lessons"> | undefined) {
  return useQuery(
    api.features.courses.manage.getLessonForManage,
    lessonId === undefined ? "skip" : { lessonId }
  ) as LessonEditorData | undefined;
}
