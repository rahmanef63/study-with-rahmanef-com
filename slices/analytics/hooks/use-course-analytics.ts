"use client";
// analytics slice — reactive per-course analytics read (rr data-fetching:
// useQuery, never fetch in useEffect). Cast to the slice projection type —
// api.d.ts is untyped until `npx convex dev` regenerates it (docs/STATUS.md
// row #0); the cast stays valid after codegen. `undefined` while loading; the
// query is skipped until a courseId is known. Instructor+ only server-side.
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import type { CourseAnalyticsData } from "../types";

export function useCourseAnalytics(courseId: Id<"courses"> | undefined) {
  return useQuery(
    api.features.analytics.queries.getCourseAnalytics,
    courseId === undefined ? "skip" : { courseId }
  ) as CourseAnalyticsData | undefined;
}
