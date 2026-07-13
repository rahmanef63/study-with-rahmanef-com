"use client";
// notifications slice — reactive read hooks (rr "Data fetching": useQuery from
// convex/react; never fetch in useEffect). Return undefined while loading.
// `api.features.notifications.*` resolves through the checked-in AnyApi
// _generated variant; return types are pinned here from ../types.
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { NotificationItemData } from "../types";

/** The caller's inbox, unread-first (server-bounded). */
export function useNotifications(): NotificationItemData[] | undefined {
  return useQuery(api.features.notifications.queries.listMine, {});
}

/** Unread badge count, capped server-side at UNREAD_COUNT_CAP. */
export function useUnreadCount(): number | undefined {
  return useQuery(api.features.notifications.queries.unreadCount, {});
}
