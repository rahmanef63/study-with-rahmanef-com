// notifications slice — public barrel (THE contract; barrel-only cross-slice
// imports, rr-conventions P1). Integration point for alpha (#21): mount
//   <NotificationBell onNavigate={openDeepLink} />
// in the OS shell HEADER for signed-in users. Self-contained — unread badge,
// inbox popover, mark-read-on-click all come from the Convex feature; the only
// seam is onNavigate?(href) so the shell routes deep-links through its own
// window opener (default: window.location.assign, which the URL-sync resolves).
// NotificationInbox is also exported standalone (e.g. a full-page inbox app).
//
// Convex surface (not re-exported; call via api.features.notifications.*):
//   notifications:markRead · notifications:markAllRead
//   queries:listMine · queries:unreadCount
//   (internal producer target: notifications:create — see convex refs.ts)

// feature descriptor
export { notificationsFeature } from "./config";

// connected views (integrator mounts these)
export { NotificationBell, type NotificationBellProps } from "./views/notification-bell";
export { NotificationInbox, type NotificationInboxProps } from "./views/notification-inbox";

// presentational components (props-driven, portable)
export { NotificationRow, type NotificationRowProps } from "./components/notification-row";
export {
  NotificationsEmptyState,
  type NotificationsEmptyStateProps,
} from "./components/notifications-empty-state";

// hooks (reads + writes)
export { useNotifications, useUnreadCount } from "./hooks/use-notifications";
export { useMarkAllRead, useMarkRead } from "./hooks/use-notification-mutations";

// lib (pure — safe for server or client)
export { formatRelativeTime } from "./lib/time";
export { extractNotificationsError, notificationsErrorMessage } from "./lib/errors";

// copy (props-driven defaults)
export {
  NOTIFICATIONS_COPY,
  mergeNotificationsCopy,
  type NotificationsCopy,
  type NotificationsCopyOverride,
} from "./config/copy";

// limits (UI mirrors of the server bounds)
export { READ_TAKE, UNREAD_COUNT_CAP, UNREAD_TAKE } from "./config/limits";

// types
export type {
  NotificationItemData,
  NotificationKind,
  NotificationsErrorCode,
} from "./types";
