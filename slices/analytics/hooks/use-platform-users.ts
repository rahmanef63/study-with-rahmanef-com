"use client";
import { useConvexAuth, usePaginatedQuery, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";

/** Both the host gate and current Convex identity must be ready before querying. */
export function usePlatformUsers({ enabled, search }: { enabled: boolean; search: string }) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  return usePaginatedQuery(api.features.userAnalytics.users.listUsers,
    enabled && isAuthenticated && !isLoading ? (search.trim() ? { search: search.trim() } : {}) : "skip",
    { initialNumItems: 20 });
}
export function usePlatformUserDetail({ enabled, userId }: { enabled: boolean; userId: Id<"users"> }) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  return useQuery(api.features.userAnalytics.users.getUserDetail,
    enabled && isAuthenticated && !isLoading ? { userId } : "skip");
}
