"use client";
// "Lanjutkan belajar" — gabungan dua sumber (v1.7 #37):
//   1. SERVER (lintas perangkat): kelas dengan penyelesaian materi terakhir
//      milik user (progress.recentCourses — login only).
//   2. LOKAL (per perangkat): kelas yang baru DIBUKA (recent-courses.ts) —
//      tetap berguna untuk tamu dan untuk kelas yang belum ada progresnya.
// Server dulu (truth), lalu entri lokal yang belum terwakili; cap 6.
import { useEffect, useState } from "react";
import { useRecentCourses } from "@/features/progress";
import { getRecentCourses, type RecentCourse } from "./recent-courses";

const CAP = 6;

export function useResumeCourses(): RecentCourse[] {
  // localStorage dibaca post-mount (SSR-safe, pola lama dipertahankan).
  const [local, setLocal] = useState<RecentCourse[]>([]);
  useEffect(() => setLocal(getRecentCourses()), []);
  const server = useRecentCourses(); // undefined = memuat · [] = anon/kosong

  const merged: RecentCourse[] = (server ?? []).map((r) => ({
    tenantSlug: r.tenantSlug,
    courseSlug: r.courseSlug,
    title: r.title,
  }));
  for (const c of local) {
    if (merged.length >= CAP) break;
    if (!merged.some((m) => m.tenantSlug === c.tenantSlug && m.courseSlug === c.courseSlug)) {
      merged.push(c);
    }
  }
  return merged.slice(0, CAP);
}
