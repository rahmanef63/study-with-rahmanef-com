"use client";
// Notification bell in the shell chrome (#27, mounts STATUS #21). Fills the
// `menuBarStatus` slot — the macOS menu bar, Windows taskbar tray, and the
// Dashboard header all render that region (Slot renders every feature's
// component in manifest order, so this coexists with accountFeature; listed
// BEFORE it in the manifest → bell sits left of the avatar). Mobile shells
// have no menu bar; they reach the same inbox via the Notifikasi app.
//
// Auth gate lives HERE (not in the slice): useUnreadCount fires requireUser
// server-side, so rendering the bell while signed out would throw into the
// chrome. Render null until authenticated — same guard AccountMenu uses.
import { defineFeature } from "@/features/appshell";
// PERF: light sub-barrels — this feature mounts in the eager menu bar; the
// full slice barrels would drag every view into the initial JS chunk.
import { NotificationBell } from "@/features/notifications/views";
import { useCurrentProfile } from "@/features/profiles/hooks";
import { openHref } from "./apps/_nav";

function NotificationBellStatus() {
  const { isAuthenticated, isLoading } = useCurrentProfile();
  if (isLoading || !isAuthenticated) return null;
  return (
    <NotificationBell
      onNavigate={openHref}
      className="h-auto size-6 rounded-md hover:bg-[var(--hover-strong)]"
    />
  );
}

// Named like accountFeature: one slot, chrome-level, no provider needed.
export const notificationsStatusFeature = defineFeature({
  id: "notifications-bell",
  kind: "custom",
  slots: { menuBarStatus: NotificationBellStatus },
});
