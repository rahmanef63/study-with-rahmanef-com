"use client";
// notifications slice — NotificationBell({}): bell + unread badge + popover
// inbox. THE barrel view alpha mounts in the OS shell header for signed-in
// users (#21). Pattern: rr `notifications-center` (bell + popover surface),
// adapted onto our Convex hooks instead of its adapter seam. The popover
// closes on navigation so the target window is visible immediately.
import { useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { mergeNotificationsCopy, type NotificationsCopyOverride } from "../config/copy";
import { UNREAD_COUNT_CAP } from "../config/limits";
import { useUnreadCount } from "../hooks/use-notifications";
import { NotificationInbox } from "./notification-inbox";

export type NotificationBellProps = {
  /** OS-shell deep-link seam, forwarded to the inbox (see NotificationInbox). */
  onNavigate?: (href: string) => void;
  copy?: NotificationsCopyOverride;
  className?: string;
};

export function NotificationBell({ onNavigate, copy: copyOverride, className }: NotificationBellProps) {
  const copy = mergeNotificationsCopy(copyOverride);
  const unread = useUnreadCount() ?? 0;
  const [open, setOpen] = useState(false);

  const badge = unread >= UNREAD_COUNT_CAP ? copy.unreadOverflow : `${unread}`;
  const bellLabel = unread > 0 ? `${copy.bellLabel} (${badge} ${copy.unreadBadgeLabel})` : copy.bellLabel;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={bellLabel}
          className={className ? `relative ${className}` : "relative"}
        >
          <Bell className="size-4" aria-hidden />
          {unread > 0 ? (
            <span
              className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-none text-primary-foreground"
              aria-hidden
            >
              {badge}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <NotificationInbox
          copy={copyOverride}
          onNavigate={(href) => {
            setOpen(false); // reveal the window the deep-link opens
            if (onNavigate) onNavigate(href);
            else window.location.assign(href);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
