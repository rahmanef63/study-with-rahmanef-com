// tenants slice — Convex function references (one place to update if the
// convex/features/tenants layout ever moves). Consumers (pages, other slices)
// use these for preloadQuery/useQuery instead of hand-writing paths.
import { api } from "@convex/_generated/api";

export const tenantsApi = {
  /** query — public: safe tenant by slug or null (inactive = null). */
  getPublicBySlug: api.features.tenants.queries.getPublicBySlug,
  /** query — public: active communities for the landing etalase. */
  listActive: api.features.tenants.queries.listActive,
  /** query — owner: manage view (hasDiscordWebhook flag, never the URL). */
  getManageView: api.features.tenants.queries.getManageView,
  /** query — authed: caller's membership in a tenant or null. */
  getMyMembership: api.features.tenants.members.getMyMembership,
  /** query — member: bounded member roster with profile info. */
  listMembers: api.features.tenants.members.listMembers,
  /** mutation — authed: idempotent join as member. */
  join: api.features.tenants.mutations.join,
  /** mutation — owner: edit profile ("" clears optional fields). */
  updateProfile: api.features.tenants.mutations.updateProfile,
  /** mutation — owner: member ↔ instructor (R13 data layer). */
  setMemberRole: api.features.tenants.mutations.setMemberRole,
};
