// notifications slice — views sub-barrel (re-exports only), a LIGHT public
// entry beside the full barrel (../index.ts). The eager OS-shell menu-bar bell
// imports from here so the barrel's side-effectful feature config never enters
// the initial JS chunk (see docs/SLICES.md "Light entries").
export { NotificationBell, type NotificationBellProps } from "./notification-bell";
export { NotificationInbox, type NotificationInboxProps } from "./notification-inbox";
