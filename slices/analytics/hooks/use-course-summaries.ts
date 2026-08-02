"use client";
// analytics slice — reactive per-tenant course summaries for the kelola list
// ({ completionCount, memberCount } per course). Same casting rationale as
// use-course-analytics.ts. Instructor+ only server-side.
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import type { CourseSummaryData } from "../types";

export function useCourseSummaries(tenantId: Id<"tenants"> | undefined) {
  return useQuery(
    api.features.analytics.queries.listCourseSummaries,
    tenantId === undefined ? "skip" : { tenantId }
  ) as CourseSummaryData[] | undefined;
}
