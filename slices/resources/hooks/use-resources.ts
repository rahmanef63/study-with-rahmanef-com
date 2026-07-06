"use client";
// resources slice — reactive resource reads (rr data-fetching: useQuery, never
// fetch in useEffect). `undefined` while loading. The pending queue is
// instructor-only on the server, so its hook is gated by `enabled` → "skip" to
// avoid a NOT_AUTHORIZED throw for plain members (defence-in-depth; the query
// still enforces it). Casts stay valid after api.d.ts codegen (STATUS row #0).
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import type { ResourceCard, ResourceReviewItem } from "../types";

export function useApprovedResources(tenantId: Id<"tenants"> | undefined) {
  return useQuery(
    api.features.resources.queries.listApprovedResources,
    tenantId === undefined ? "skip" : { tenantId }
  ) as ResourceCard[] | undefined;
}

export function usePendingResources(
  tenantId: Id<"tenants"> | undefined,
  enabled: boolean
) {
  return useQuery(
    api.features.resources.queries.listPendingResources,
    tenantId === undefined || !enabled ? "skip" : { tenantId }
  ) as ResourceReviewItem[] | undefined;
}

export function useMyResources(tenantId: Id<"tenants"> | undefined) {
  return useQuery(
    api.features.resources.queries.listMineResources,
    tenantId === undefined ? "skip" : { tenantId }
  ) as ResourceCard[] | undefined;
}
