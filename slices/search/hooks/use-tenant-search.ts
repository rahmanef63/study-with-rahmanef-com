"use client";
// search slice — reactive read hook (rr "Data fetching": useQuery from
// convex/react; never fetch in useEffect). The query is SKIPPED until the
// trimmed keyword is inside the 2..60 window, so invalid input never reaches
// the server (which re-validates anyway — client gates are UX only).
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { MAX_QUERY_LENGTH, MIN_QUERY_LENGTH } from "../config/limits";
import type { SearchInTenantResult } from "../types";

export type TenantSearchState = {
  /** Trimmed keyword actually used (empty when inactive). */
  q: string;
  /** Keyword long enough to search — drives the idle-hint state. */
  active: boolean;
  /** undefined = loading (only meaningful while active). */
  hits: SearchInTenantResult | undefined;
};

export function useTenantSearch(
  tenantId: Id<"tenants">,
  rawQuery: string
): TenantSearchState {
  const q = rawQuery.trim().slice(0, MAX_QUERY_LENGTH);
  const active = q.length >= MIN_QUERY_LENGTH;
  const hits = useQuery(
    api.features.search.queries.searchInTenant,
    active ? { tenantId, q } : "skip"
  ) as SearchInTenantResult | undefined;
  return { q, active, hits: active ? hits : undefined };
}
