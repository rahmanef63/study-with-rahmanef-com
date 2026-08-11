// Community (tenant) vocabulary — THE import path. `@/lib/community` is what
// every consumer writes; the two modules behind it are an implementation
// detail of the 200-LOC ceiling, not a second public surface.
//
//   ./community-href.ts — the /k/<slug> URL shape. The ONE place it is written
//                         down, so the prefix can change in one edit instead of
//                         a repo-wide grep.
//   ./community-tabs.ts — which sections a community offers, in what order, and
//                         which of them hide when the tenant has nothing behind
//                         them (TenantTabSignal).
//
// The backend stays fully multi-tenant; the UI is single-community-FIRST: `/`
// redirects to DEFAULT_COMMUNITY_SLUG and the directory is demoted to
// /komunitas, so a learner normally never sees a community picker.
export { DEFAULT_COMMUNITY_SLUG, communityHref } from "./community-href";
export {
  COMMUNITY_TABS,
  PHONE_BAR_SLOTS,
  TAB_SIGNAL_UNKNOWN,
  phoneBarTabs,
  visibleCommunityTabs,
  type CommunityTab,
  type TenantTabSignal,
} from "./community-tabs";
