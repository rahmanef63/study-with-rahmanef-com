"use client";

// Reactive own-profile read. Query is skipped until Convex auth reports a
// session, so signed-out visitors never hit the NOT_AUTHENTICATED throw —
// P0 keeps requireUser as the first server line; the skip is pure UX.
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { CurrentProfile } from "../types";

export type UseCurrentProfileResult = {
  /** null = signed out OR profile not created yet (see isLoading). */
  profile: CurrentProfile | null;
  /** true while auth state or the initial query result is still unknown. */
  isLoading: boolean;
  isAuthenticated: boolean;
};

export function useCurrentProfile(): UseCurrentProfileResult {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const profile = useQuery(
    api.features.profiles.queries.getCurrentProfile,
    isAuthenticated ? {} : "skip"
  ) as CurrentProfile | null | undefined;
  return {
    profile: profile ?? null,
    isLoading: authLoading || (isAuthenticated && profile === undefined),
    isAuthenticated,
  };
}
