// The app shell — THE import path. `@/components/shell` is what every consumer
// writes; the modules behind it are an implementation detail of the 200-LOC
// ceiling, not a second public surface.
//
// SCOPE. This shell belongs to the APP surfaces: everything under /k/<slug>,
// and the account pages a signed-in reader navigates to from the rail
// (/notifikasi, /pengaturan, /changelog, /u/<username>) once someone gives them
// a layout. It deliberately does NOT belong on the public funnel — /mulai is
// where a stranger who has not joined lands, /sertifikat is a shareable
// artifact, /masuk is a single card, and wrapping any of them in a dashboard
// would put a member's navigation around a page whose whole job is to be read
// by someone who is not one.
export { AppShell, ShellRailSkeleton, SHELL_GUTTER } from "./app-shell";
export { DockBar, DOCK_CELL_CLASS, dockIconBox, type DockCell } from "./dock-bar";
export { ShellDock } from "./shell-dock";
export { ShellNav, type ShellNavProps } from "./shell-nav";
export { SidebarSwitcher } from "./sidebar-switcher";
export { SidebarUser } from "./sidebar-user";
export { ShellTopBar, ShellTopBarSkeleton } from "./shell-top-bar";
export { useCloseAboveMd } from "./use-close-above-md";
export { ShellAction, type ShellActionVariant } from "./shell-action";
export { SidebarContent, SidebarFooter, SidebarGroup, SidebarHeader } from "./sidebar";
export { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "./sidebar-menu";
export {
  ACCOUNT_LINKS,
  HOME_LINK,
  EXPLORE_LINKS,
  ICON_KEYS,
  communityToolLinks,
  iconFor,
  isPathActive,
  kelolaLink,
  profileLink,
  type ShellLink,
} from "./nav-model";
