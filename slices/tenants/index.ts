// tenants slice — public barrel (re-exports only). This is the contract:
// consumers (app routes, other slices) import ONLY from here.

// Views (integrator mounts these on /t/[slug] and /t/[slug]/kelola/komunitas)
export { TenantHomeView, type TenantHomeViewProps } from "./components/tenant-home-view";
export {
  TenantSettingsView,
  type TenantSettingsViewProps,
} from "./components/tenant-settings-view";

// Building blocks
export { JoinButton, type JoinButtonProps } from "./components/join-button";
export { MembersList, type MembersListProps } from "./components/members-list";
export {
  TenantProfileCard,
  type TenantProfileCardProps,
} from "./components/tenant-profile-card";
export {
  TenantProfileForm,
  type TenantProfileFormProps,
  type TenantProfileSubmitValues,
} from "./components/tenant-profile-form";
export { RoleChip } from "./components/role-chip";

// Hooks
export {
  useJoinTenant,
  useSetMemberRole,
  useUpdateTenantProfile,
} from "./hooks/use-tenant-mutations";
export {
  useActiveTenants,
  useMyMembership,
  useTenantBySlug,
  useTenantManageView,
  useTenantMembers,
} from "./hooks/use-tenant-queries";

// Convex function refs (for preloadQuery / fetchQuery at the route level)
export { tenantsApi } from "./api";

// Config & lib
export { tenantsFeature } from "./config";
export { DEFAULT_TENANT_LABELS, TENANT_TRACK_PRESETS } from "./config/labels";
export { errorToCopy, extractErrorCode } from "./lib/error-copy";

// Types
export type {
  ManagedTenant,
  MyMembership,
  PublicTenant,
  TenantLabels,
  TenantMember,
  TenantProfileFormValues,
  TenantRole,
  TenantsErrorCode,
} from "./types";
