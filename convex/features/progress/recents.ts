// progress feature — "Lanjutkan belajar" lintas perangkat (v1.7 #37; OS-14/B3
// dari runbook owner). P0 contract: requireUser baris pertama; rows milik
// sendiri by construction (userId dari ctx, index by_user); bounded take;
// proyeksi eksplisit tanpa id internal selain yang dibutuhkan deep-link.
import { query } from "../../_generated/server";
import { requireUser } from "../../_shared/auth";
import type { Doc, Id } from "../../_generated/dataModel";
import { listLessonPlacements } from "./derive";

/** Scan penyelesaian terakhir (bounded) sebelum dedupe per course. */
const SCAN_TAKE = 60;
/** Maksimum kartu "Lanjutkan belajar" yang dikembalikan. */
export const RECENT_TAKE = 6;

export type RecentCourseItem = {
  tenantSlug: string;
  courseSlug: string;
  title: string;
  /** Epoch ms penyelesaian materi terakhir di kelas itu. */
  lastAt: number;
};

/**
 * Kelas-kelas yang terakhir dikerjakan si pemanggil — lintas perangkat
 * (sumber: lessonCompletions milik sendiri, newest first, dedupe per course).
 *
 * MATERI MODEL (DECISIONS #36/#37): `lessonCompletions.courseId` kini cuma
 * PROVENANCE dan boleh kosong, jadi kelas untuk "lanjutkan" di-resolve lewat
 * `courseLessons.by_lesson` — satu materi bisa memunculkan beberapa kelas, dan
 * materi yang tidak ada di kelas manapun (cuma di pustaka) DILEWATI, bukan
 * bikin query gagal. Hanya kelas PUBLISHED di tenant ACTIVE yang muncul (kelas
 * yang ditarik dari peredaran tidak meninggalkan kartu mati).
 * Anonymous → NOT_AUTHENTICATED.
 */
export const recentCourses = query({
  args: {},
  handler: async (ctx): Promise<RecentCourseItem[]> => {
    const userId = await requireUser(ctx); // auth FIRST (P0)

    const completions = await ctx.db
      .query("lessonCompletions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(SCAN_TAKE);

    // Scan sudah desc, jadi kemunculan PERTAMA sebuah kelas = yang terbaru:
    // dedupe sambil jalan dan berhenti begitu kuota kartu penuh.
    const items: RecentCourseItem[] = [];
    const seenCourses = new Set<Id<"courses">>();
    const tenantCache = new Map<Id<"tenants">, Doc<"tenants"> | null>();

    for (const completion of completions) {
      if (items.length >= RECENT_TAKE) break;
      const placements = await listLessonPlacements(ctx, completion.lessonId);
      for (const placement of placements) {
        if (items.length >= RECENT_TAKE) break;
        if (seenCourses.has(placement.courseId)) continue;
        seenCourses.add(placement.courseId);

        const course = await ctx.db.get(placement.courseId);
        if (course === null || course.status !== "published") continue;
        let tenant = tenantCache.get(course.tenantId);
        if (tenant === undefined) {
          tenant = await ctx.db.get(course.tenantId);
          tenantCache.set(course.tenantId, tenant);
        }
        if (tenant === null || tenant.status !== "active") continue;
        items.push({
          tenantSlug: tenant.slug,
          courseSlug: course.slug,
          title: course.title,
          lastAt: completion._creationTime,
        });
      }
    }
    return items;
  },
});
