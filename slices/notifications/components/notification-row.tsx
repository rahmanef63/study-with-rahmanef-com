"use client";
// notifications slice — one inbox row. Presentational + props-driven (the view
// owns markRead/navigation); shadcn Button as the interactive surface (no raw
// <button>, rr UI rules). Unread rows carry a leading dot on theme tokens.
import { Button } from "@/components/ui/button";
import { formatRelativeTime } from "../lib/time";
import type { NotificationItemData } from "../types";

export type NotificationRowProps = {
  item: NotificationItemData;
  /** Screen-reader label appended to unread rows (copy.unreadBadgeLabel). */
  unreadLabel: string;
  onSelect: (item: NotificationItemData) => void;
};

export function NotificationRow({ item, unreadLabel, onSelect }: NotificationRowProps) {
  const unread = item.readAt === null;
  return (
    <li>
      <Button
        variant="ghost"
        onClick={() => onSelect(item)}
        className="h-auto w-full justify-start gap-3 rounded-none px-4 py-3 text-left whitespace-normal"
      >
        <span
          className={
            unread
              ? "mt-1.5 size-2 shrink-0 self-start rounded-full bg-primary"
              : "mt-1.5 size-2 shrink-0 self-start rounded-full bg-transparent"
          }
          aria-hidden
        />
        <span className="min-w-0 flex-1 space-y-0.5">
          <span className={unread ? "block text-sm font-semibold" : "block text-sm font-medium"}>
            {item.title}
            {unread ? <span className="sr-only"> ({unreadLabel})</span> : null}
          </span>
          {item.body !== null ? (
            <span className="block truncate text-xs text-muted-foreground">{item.body}</span>
          ) : null}
          <span className="block text-xs text-muted-foreground">
            {formatRelativeTime(item.createdAt)}
          </span>
        </span>
      </Button>
    </li>
  );
}
