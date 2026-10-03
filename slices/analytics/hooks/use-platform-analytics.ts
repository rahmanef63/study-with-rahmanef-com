"use client";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { PlatformAnalyticsData, PlatformAnalyticsDays } from "../types";

/** enabled comes from the host's current-profile gate; server authorization is mandatory. */
export function usePlatformAnalytics({ enabled, days }: { enabled: boolean; days: PlatformAnalyticsDays }) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  return useQuery(
    api.features.analytics.platform.getPlatformAnalytics,
    enabled && isAuthenticated && !isLoading ? { days } : "skip",
  ) as PlatformAnalyticsData | undefined;
}
