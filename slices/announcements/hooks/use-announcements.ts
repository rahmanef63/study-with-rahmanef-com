"use client";
// announcements slice — reactive tenant announcements read (rr data-fetching:
// useQuery, never fetch in useEffect). Cast to the slice projection type; the
// query is skipped until a tenantId is known. `undefined` while loading.
import { useQuery } from "convex/react";
import type { Id } from "@convex/_generated/dataModel";
import { announcementsApi } from "../api";
import type { AnnouncementView } from "../types";

export function useAnnouncements(tenantId: Id<"tenants"> | undefined) {
  return useQuery(
    announcementsApi.list,
    tenantId === undefined ? "skip" : { tenantId }
  ) as AnnouncementView[] | undefined;
}
