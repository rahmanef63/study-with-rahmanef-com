import { api } from "@convex/_generated/api";
import { ogCard, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og";
import { safeQuery } from "@/lib/convex-server";

export const alt = "Tentang komunitas";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [tenant, stats] = await Promise.all([
    safeQuery(api.features.tenants.queries.getPublicBySlug, { slug }),
    safeQuery(api.features.tenants.queries.getPublicStatsBySlug, { slug }),
  ]);
  // safeQuery never throws, so an unknown slug or a Convex outage still yields a
  // valid card rather than failing the image route.
  const subtitle =
    stats === null
      ? tenant?.description
      : `${stats.memberCount}${stats.memberCountCapped ? "+" : ""} anggota · ${stats.courseCount} kelas`;
  return ogCard({
    eyebrow: "Komunitas belajar",
    title: tenant?.name ?? "Komunitas",
    subtitle,
  });
}
