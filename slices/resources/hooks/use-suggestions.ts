"use client";
// resources slice — reactive suggestion reads (rr data-fetching: useQuery).
// `undefined` while loading; skipped until a tenantId is known. Cards carry
// the derived { voteCount, myVote } since #18 (backward-compatible superset).
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import type { SuggestionCardWithVotes } from "../types";

export function useOpenSuggestions(tenantId: Id<"tenants"> | undefined) {
  return useQuery(
    api.features.resources.queries.listOpenSuggestions,
    tenantId === undefined ? "skip" : { tenantId }
  ) as SuggestionCardWithVotes[] | undefined;
}

export function useMySuggestions(tenantId: Id<"tenants"> | undefined) {
  return useQuery(
    api.features.resources.queries.listMineSuggestions,
    tenantId === undefined ? "skip" : { tenantId }
  ) as SuggestionCardWithVotes[] | undefined;
}
