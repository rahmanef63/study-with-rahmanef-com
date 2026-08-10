import { api } from "@convex/_generated/api";
import { ogCard, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og";
import { safeQuery } from "@/lib/convex-server";

// Social card for the community ROOT — the URL people actually paste.
//
// It was missing. app/k/[slug]/layout.tsx sets `openGraph`, and a route that
// declares openGraph without images does NOT inherit the app-root
// opengraph-image, so /k/<slug> had no card at all. Until 2026-08-10 the gap
// was masked by tenant.coverImageUrl, which the seeds had filled with a
// picsum.photos stock photo; clearing that (correctly) left every shared
// community link unfurling with no picture — worse, for the one thing this
// whole product change was about, than the stock photo it replaced.
//
// A colocated route file wins over an owner cover deliberately: this card
// carries the community NAME and its live member/course counts, which is what a
// recipient needs, and it can never point at a third-party host.
export const alt = "Komunitas belajar";
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
  return ogCard({
    eyebrow: "Komunitas belajar · Gratis",
    title: tenant?.name ?? "Komunitas belajar",
    subtitle:
      stats === null
        ? (tenant?.description ?? undefined)
        : `${stats.memberCount}${stats.memberCountCapped ? "+" : ""} anggota · ${stats.courseCount} kelas`,
  });
}
