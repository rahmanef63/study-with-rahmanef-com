"use client";
// progress slice — "Lanjutkan belajar" lintas perangkat (v1.7 #37).
// Reactive read (rr "Data fetching": useQuery, never fetch-in-effect); SKIP
// saat anon supaya tidak melempar NOT_AUTHENTICATED ke render — pemanggil
// (os-shell) mem-fallback ke recents localStorage untuk tamu.
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { RecentCourseItem } from "@convex/features/progress/recents";

export type { RecentCourseItem };

/**
 * Kelas yang terakhir dikerjakan si pengguna (server truth, lintas perangkat).
 * undefined = masih memuat · [] = anon ATAU belum ada aktivitas.
 */
export function useRecentCourses(): RecentCourseItem[] | undefined {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const rows = useQuery(
    api.features.progress.recents.recentCourses,
    isAuthenticated ? {} : "skip"
  ) as RecentCourseItem[] | undefined;
  if (isLoading) return undefined;
  if (!isAuthenticated) return [];
  return rows;
}
