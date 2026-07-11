"use client";
// pageviews slice — reactive Traffic summary read (platform-admin). Mounted only
// for admins by the consumer; the server query re-checks requirePlatformAdmin,
// so calling it as a non-admin throws NOT_AUTHORIZED (route guards = UX).
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { TrafficSummary } from "../types";

export function useTrafficSummary(sinceMs: number): TrafficSummary | undefined {
  return useQuery(api.features.pageviews.queries.summary, { sinceMs }) as
    | TrafficSummary
    | undefined;
}
