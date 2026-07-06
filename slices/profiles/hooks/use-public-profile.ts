"use client";

// Reactive read for the public /u/[username] page. Both queries are ANONYMOUS
// (etalase, AGENTS.md §6) so no auth token is needed — this works for
// signed-out visitors. An unknown handle makes the queries THROW NOT_FOUND;
// useQuery re-throws it during render, where PublicProfileBoundary catches it
// (rr "data fetching": reads live in useQuery, never useEffect).
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Badge, PublicProfile, PublicProfileData } from "../types";

export function usePublicProfile(username: string): PublicProfileData {
  const profile = useQuery(api.features.profiles.public.publicGetByUsername, {
    username,
  }) as PublicProfile | undefined;
  const badges = useQuery(api.features.profiles.public.publicListBadges, {
    username,
  }) as Badge[] | undefined;

  return {
    profile: profile ?? null,
    badges: badges ?? [],
    isLoading: profile === undefined || badges === undefined,
  };
}
