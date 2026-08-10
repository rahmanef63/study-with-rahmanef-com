import type { MetadataRoute } from "next";
import { api } from "@convex/_generated/api";
import { SITE_ORIGIN, safeQuery } from "@/lib/convex-server";

// Enumerates the crawlable surface: the community directory, every active
// community's tabs, every published course, and every published MATERI
// permalink. All source queries are on the anonymous etalase whitelist
// (AGENTS.md §6).
//
// The materi permalinks matter more than their count suggests: /materi itself
// is `robots: { index: false }` because it lists member content, so the sitemap
// is a crawler's ONLY path to a materi page. Leaving them out would mean
// building a shareable, indexable per-lesson address and never telling anyone.
//
// Bounded by construction — listActive is capped server-side and listPublished
// takes LIST_TAKE — so this never walks an unbounded table. safeQuery means a
// Convex outage yields a short sitemap instead of a 500.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [
    { url: SITE_ORIGIN, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_ORIGIN}/komunitas`, lastModified: now, changeFrequency: "weekly" },
  ];

  const tenants = (await safeQuery(api.features.tenants.queries.listActive, {})) ?? [];

  for (const tenant of tenants) {
    const base = `${SITE_ORIGIN}/k/${tenant.slug}`;
    entries.push(
      // /k/<slug> IS the course list (Kelas is the index tab), so there is no
      // separate /kelas entry to advertise.
      { url: base, lastModified: now, changeFrequency: "daily", priority: 0.9 },
      { url: `${base}/tentang`, lastModified: now, changeFrequency: "monthly" }
    );

    const courses =
      (await safeQuery(api.features.courses.queries.listPublished, {
        tenantId: tenant._id,
      })) ?? [];
    for (const course of courses) {
      entries.push({
        url: `${base}/kelas/${course.slug}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }

    const materi =
      (await safeQuery(api.features.materi.queries.publicListSlugs, {
        tenantId: tenant._id,
      })) ?? [];
    for (const item of materi) {
      entries.push({
        url: `${base}/materi/${item.slug}`,
        lastModified: new Date(item.updatedAt),
        changeFrequency: "monthly",
        priority: 0.7,
      });
    }
  }

  return entries;
}
