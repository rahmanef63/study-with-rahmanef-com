"use client";
// announcements slice — the create mutation hook (rr "Error handling": catch
// here, map ConvexError.code → copy, surface via sonner). Tracks its own pending
// flag; Convex reactivity refreshes the list query after the write.
import { useMutation } from "convex/react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import type { Id } from "@convex/_generated/dataModel";
import { announcementsApi } from "../api";
import { mergeAnnouncementsCopy, type AnnouncementsCopyOverride } from "../config/copy";
import { announcementErrorMessage } from "../lib/errors";
import type { CreateAnnouncementResult, CreateAnnouncementValues } from "../types";

export function useCreateAnnouncement(copyOverride?: AnnouncementsCopyOverride) {
  const copy = mergeAnnouncementsCopy(copyOverride);
  const createRaw = useMutation(announcementsApi.create);
  const [isPending, setIsPending] = useState(false);

  const createAnnouncement = useCallback(
    async (
      tenantId: Id<"tenants">,
      values: CreateAnnouncementValues
    ): Promise<CreateAnnouncementResult | null> => {
      setIsPending(true);
      try {
        const result = (await createRaw({
          tenantId,
          ...values,
        })) as CreateAnnouncementResult;
        toast.success(copy.createSuccess);
        return result;
      } catch (error) {
        toast.error(announcementErrorMessage(error, copy));
        return null;
      } finally {
        setIsPending(false);
      }
    },
    [createRaw, copy]
  );

  return { createAnnouncement, isPending };
}
