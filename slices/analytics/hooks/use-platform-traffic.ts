"use client";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { PlatformTrafficData, PlatformTrafficDays } from "../types";

/** The host passes enabled only after current-profile platform admin authorization. */
export function usePlatformTraffic({ enabled, days }: { enabled: boolean; days: PlatformTrafficDays }) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  return useQuery(api.features.traffic.queries.getTrafficAnalytics, enabled && isAuthenticated && !isLoading ? { days } : "skip") as PlatformTrafficData | undefined;
}
