"use client";
// progress slice — reactive course-progress read (rr data-fetching: useQuery,
// never fetch in useEffect). Cast to the slice projection type — api.d.ts is
// untyped until `npx convex dev` regenerates it (docs/STATUS.md row #0); the
// cast stays valid after codegen. `undefined` while loading; the query is
// skipped until a courseId is known.
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import type { CourseProgressData } from "../types";

export function useCourseProgress(courseId: Id<"courses"> | undefined) {
  return useQuery(
    api.features.progress.queries.getCourseProgress,
    courseId === undefined ? "skip" : { courseId }
  ) as CourseProgressData | undefined;
}
