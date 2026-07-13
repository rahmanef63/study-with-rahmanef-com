"use client";
// notifications slice — write hooks (rr "Error handling": catch here, map
// ConvexError.code → copy, toast via sonner). markRead stays silent on
// success (it fires on click-through — a toast would be noise); markAllRead
// confirms with a toast.
import { useMutation } from "convex/react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { mergeNotificationsCopy, type NotificationsCopyOverride } from "../config/copy";
import { notificationsErrorMessage } from "../lib/errors";

export function useMarkRead(copyOverride?: NotificationsCopyOverride) {
  const copy = mergeNotificationsCopy(copyOverride);
  const markRaw = useMutation(api.features.notifications.notifications.markRead);

  const markRead = useCallback(
    async (notificationId: Id<"notifications">): Promise<boolean> => {
      try {
        await markRaw({ notificationId });
        return true;
      } catch (error) {
        toast.error(notificationsErrorMessage(error, copy));
        return false;
      }
    },
    [markRaw, copy]
  );

  return { markRead };
}

export function useMarkAllRead(copyOverride?: NotificationsCopyOverride) {
  const copy = mergeNotificationsCopy(copyOverride);
  const markAllRaw = useMutation(api.features.notifications.notifications.markAllRead);
  const [isPending, setIsPending] = useState(false);

  const markAllRead = useCallback(async (): Promise<boolean> => {
    setIsPending(true);
    try {
      await markAllRaw({});
      toast.success(copy.markAllSuccess);
      return true;
    } catch (error) {
      toast.error(notificationsErrorMessage(error, copy));
      return false;
    } finally {
      setIsPending(false);
    }
  }, [markAllRaw, copy]);

  return { markAllRead, isPending };
}
