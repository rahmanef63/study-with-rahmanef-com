"use client";
// notifications slice — NotificationInbox({}): the inbox list alpha can mount
// standalone or (default) inside NotificationBell's popover. Self-contained:
// reads via useNotifications, writes via the mutation hooks. Clicking a row
// marks it read, then navigates via the onNavigate seam (props — the slice
// never imports os-shell; pattern: gamma's SearchView seam). Security lives
// server-side; every gate here is UX only.
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { mergeNotificationsCopy, type NotificationsCopyOverride } from "../config/copy";
import { useNotifications } from "../hooks/use-notifications";
import { useMarkAllRead, useMarkRead } from "../hooks/use-notification-mutations";
import { NotificationRow } from "../components/notification-row";
import { NotificationsEmptyState } from "../components/notifications-empty-state";
import type { NotificationItemData } from "../types";

export type NotificationInboxProps = {
  /**
   * OS-shell deep-link seam: called with the notification's href after it is
   * marked read. Default falls back to a full-page navigation, which the
   * shell's URL-sync resolves into the right window.
   */
  onNavigate?: (href: string) => void;
  copy?: NotificationsCopyOverride;
  className?: string;
};

export function NotificationInbox({ onNavigate, copy: copyOverride, className }: NotificationInboxProps) {
  const copy = mergeNotificationsCopy(copyOverride);
  const items = useNotifications();
  const { markRead } = useMarkRead(copyOverride);
  const { markAllRead, isPending: markingAll } = useMarkAllRead(copyOverride);

  const hasUnread = items?.some((item) => item.readAt === null) ?? false;

  const handleSelect = (item: NotificationItemData) => {
    void markRead(item._id); // fire-and-forget; navigation must not wait
    if (item.href !== null) {
      if (onNavigate) onNavigate(item.href);
      else window.location.assign(item.href);
    }
  };

  return (
    <section className={className ?? "flex max-h-96 w-full flex-col"}>
      <header className="flex items-center justify-between gap-2 px-4 py-2">
        <h2 className="text-sm font-semibold">{copy.inboxTitle}</h2>
        {hasUnread ? (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground"
            onClick={() => void markAllRead()}
            disabled={markingAll}
          >
            {copy.markAllRead}
          </Button>
        ) : null}
      </header>
      <Separator />

      {items === undefined ? (
        <div className="space-y-2 p-4" aria-busy>
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : items.length === 0 ? (
        <NotificationsEmptyState title={copy.emptyTitle} hint={copy.emptyHint} />
      ) : (
        <ScrollArea className="min-h-0 flex-1">
          <ul className="divide-y divide-border">
            {items.map((item) => (
              <NotificationRow
                key={item._id}
                item={item}
                unreadLabel={copy.unreadBadgeLabel}
                onSelect={handleSelect}
              />
            ))}
          </ul>
        </ScrollArea>
      )}
    </section>
  );
}
