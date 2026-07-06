"use client";
// resources slice — reactive suggestion reads (rr data-fetching: useQuery).
// `undefined` while loading; skipped until a tenantId is known.
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import type { SuggestionCard } from "../types";

export function useOpenSuggestions(tenantId: Id<"tenants"> | undefined) {
  return useQuery(
    api.features.resources.queries.listOpenSuggestions,
    tenantId === undefined ? "skip" : { tenantId }
  ) as SuggestionCard[] | undefined;
}

export function useMySuggestions(tenantId: Id<"tenants"> | undefined) {
  return useQuery(
    api.features.resources.queries.listMineSuggestions,
    tenantId === undefined ? "skip" : { tenantId }
  ) as SuggestionCard[] | undefined;
}
