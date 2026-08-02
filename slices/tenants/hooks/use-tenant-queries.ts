"use client";

// tenants slice — thin reactive read hooks (convex/react useQuery wrappers).
// Auth-gated queries pass "skip" until the client is authenticated, so they
// never throw NOT_AUTHENTICATED during the auth handshake.
import { useConvexAuth, useQuery } from "convex/react";
import type { Id } from "@convex/_generated/dataModel";
import { tenantsApi } from "../api";
import type {
  ManagedTenant,
  MyCommunity,
  MyMembership,
  PendingTenantRequest,
  PublicTenant,
  TenantMember,
} from "../types";

/** Public tenant by slug; `undefined` = loading, `null` = not found/inactive. */
export function useTenantBySlug(slug: string): PublicTenant | null | undefined {
  return useQuery(tenantsApi.getPublicBySlug, { slug }) as
    | PublicTenant
    | null
    | undefined;
}

/** Active communities (landing etalase). */
export function useActiveTenants(limit?: number): PublicTenant[] | undefined {
  return useQuery(tenantsApi.listActive, { limit }) as PublicTenant[] | undefined;
}

/** Communities the caller belongs to; skip until authenticated. */
export function useMyCommunities(): MyCommunity[] | undefined {
  const { isAuthenticated } = useConvexAuth();
  return useQuery(tenantsApi.listMine, isAuthenticated ? {} : "skip") as
    | MyCommunity[]
    | undefined;
}

/** Caller's membership; `undefined` while loading OR logged out (see flag). */
export function useMyMembership(tenantId: Id<"tenants"> | undefined): {
  membership: MyMembership | undefined;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
} {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const membership = useQuery(
    tenantsApi.getMyMembership,
    isAuthenticated && tenantId ? { tenantId } : "skip"
  ) as MyMembership | undefined;
  return { membership, isAuthenticated, isAuthLoading: isLoading };
}

/** Member roster (member-only read; skip until authenticated). */
export function useTenantMembers(
  tenantId: Id<"tenants"> | undefined,
  limit?: number
): TenantMember[] | undefined {
  const { isAuthenticated } = useConvexAuth();
  return useQuery(
    tenantsApi.listMembers,
    isAuthenticated && tenantId ? { tenantId, limit } : "skip"
  ) as TenantMember[] | undefined;
}

/** Owner manage view (owner-only read; skip until authenticated). */
export function useTenantManageView(
  tenantId: Id<"tenants"> | undefined
): ManagedTenant | null | undefined {
  const { isAuthenticated } = useConvexAuth();
  return useQuery(
    tenantsApi.getManageView,
    isAuthenticated && tenantId ? { tenantId } : "skip"
  ) as ManagedTenant | null | undefined;
}

// #6 (v1.1) — request + approval reads.

/** Platform-admin pending queue (skip until authenticated; server re-checks). */
export function useAdminPendingTenants(
  limit?: number
): PendingTenantRequest[] | undefined {
  const { isAuthenticated } = useConvexAuth();
  return useQuery(
    tenantsApi.listPending,
    isAuthenticated ? { limit } : "skip"
  ) as PendingTenantRequest[] | undefined;
}

/** Caller's platform-admin flag for the admin-queue UX gate (skip until authed). */
export function useMyPlatformAdmin(): { isPlatformAdmin: boolean } | undefined {
  const { isAuthenticated } = useConvexAuth();
  return useQuery(
    tenantsApi.getMyPlatformAdmin,
    isAuthenticated ? {} : "skip"
  ) as { isPlatformAdmin: boolean } | undefined;
}
