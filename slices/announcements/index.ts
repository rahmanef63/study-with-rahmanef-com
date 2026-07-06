// announcements slice — public barrel (THE contract; barrel-only cross-slice
// imports, rr-conventions P1). Consumers import ONLY from here.
//
// Integrator mount (app/ is integrator-only):
//   /t/[slug]/pengumuman  ←  <AnnouncementsView tenantId={…} canManage={isInstructorPlus} />
//   canManage is resolved from the caller's membership (tenants barrel); the
//   real guard is the server authz on features/announcements (member read,
//   instructor+ create).
//
// Convex surface (not re-exported; referenced via announcementsApi):
//   mutations.create · queries.list · discord.postToDiscord (internal only)

// feature descriptor
export { announcementsFeature } from "./config";

// connected view (the route body)
export {
  AnnouncementsView,
  type AnnouncementsViewProps,
} from "./views/announcements-view";

// presentational building blocks (props-driven, portable)
export { AnnouncementCard, type AnnouncementCardProps } from "./components/announcement-card";
export { AnnouncementForm, type AnnouncementFormProps } from "./components/announcement-form";

// hooks (read + write)
export { useAnnouncements } from "./hooks/use-announcements";
export { useCreateAnnouncement } from "./hooks/use-announcement-mutations";

// convex function refs (for preloadQuery / fetchQuery at the route level)
export { announcementsApi } from "./api";

// lib (pure — safe for server or client)
export { announcementErrorMessage, extractAnnouncementsError } from "./lib/errors";

// copy (props-driven defaults)
export {
  ANNOUNCEMENTS_COPY,
  mergeAnnouncementsCopy,
  type AnnouncementsCopy,
  type AnnouncementsCopyOverride,
} from "./config/copy";

// types
export type {
  AnnouncementView,
  AnnouncementsErrorCode,
  CreateAnnouncementResult,
  CreateAnnouncementValues,
} from "./types";
