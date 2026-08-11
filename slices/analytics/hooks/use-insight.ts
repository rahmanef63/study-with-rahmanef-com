"use client";
// analytics slice — reactive reads over the `insight` convex feature (0.3.0).
// Same casting rationale as use-course-analytics.ts: `api.d.ts` degrades to
// `any` in this repo, so the projection type is asserted here and stays valid
// after codegen. Both queries are instructor+ SERVER-side; mounting them for a
// member throws NOT_AUTHORIZED into the surrounding error boundary, which is
// the security boundary — the console's role check is UX.
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import type { CourseFunnelData, TenantPulseData } from "../types";

/** Per-materi reads/completions for one course, in teaching order. */
export function useCourseFunnel(courseId: Id<"courses"> | undefined) {
  return useQuery(
    api.features.insight.funnel.courseFunnel,
    courseId === undefined ? "skip" : { courseId }
  ) as CourseFunnelData | undefined;
}

/** One community's weekly pulse + its read distribution. */
export function useTenantPulse(tenantId: Id<"tenants"> | undefined) {
  return useQuery(
    api.features.insight.pulse.tenantPulse,
    tenantId === undefined ? "skip" : { tenantId }
  ) as TenantPulseData | undefined;
}
