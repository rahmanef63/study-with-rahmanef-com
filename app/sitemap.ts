import type { MetadataRoute } from "next";
import { api } from "@convex/_generated/api";
import { SITE_ORIGIN, safeQuery } from "@/lib/convex-server";

// Enumerates the crawlable surface: the community directory, every active
// community's tabs, and every published course. Both source queries are on the
// anonymous etalase whitelist (AGENTS.md §6).
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
      { url: base, lastModified: now, changeFrequency: "daily", priority: 0.9 },
      { url: `${base}/kelas`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
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
  }

  return entries;
}
