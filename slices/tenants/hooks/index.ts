// tenants slice — hooks sub-barrel (re-exports only), a LIGHT public entry
// beside the full barrel (../index.ts) and ../api.ts. Eager OS-shell chrome
// (os-root, shell-activity) imports from here so the full barrel's views never
// enter the initial JS chunk (see docs/SLICES.md "Light entries").
export {
  useApproveTenant,
  useJoinTenant,
  useRejectTenant,
  useRequestTenant,
  useSetMemberRole,
  useUpdateTenantProfile,
} from "./use-tenant-mutations";
export {
  useActiveTenants,
  useAdminPendingTenants,
  useMyCommunities,
  useMyMembership,
  useMyPlatformAdmin,
  useTenantBySlug,
  useTenantManageView,
  useTenantMembers,
} from "./use-tenant-queries";
export type { MyCommunity, PublicTenant } from "../types";
