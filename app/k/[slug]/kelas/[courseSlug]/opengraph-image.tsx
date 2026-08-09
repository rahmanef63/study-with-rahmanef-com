import { api } from "@convex/_generated/api";
import { ogCard, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og";
import { safeQuery } from "@/lib/convex-server";

// Per-course social card. Same two serial etalase reads as the page (slug →
// tenant → overview); safeQuery never throws, so an unreadable/draft course
// still gets a branded card instead of a broken image.
export const alt = "Kelas";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string; courseSlug: string }>;
}) {
  const { slug, courseSlug } = await params;
  const tenant = await safeQuery(api.features.tenants.queries.getPublicBySlug, { slug });
  const overview =
    tenant === null
      ? null
      : await safeQuery(api.features.courses.queries.getOverview, {
          tenantId: tenant._id,
          courseSlug,
        });

  return ogCard({
    eyebrow: tenant === null ? "Kelas" : `${tenant.name} · Kelas`,
    title: overview?.course.title ?? "Kelas",
    subtitle:
      overview === null
        ? undefined
        : `${overview.modules.length} modul · ${overview.lessonCount} materi · gratis`,
  });
}
