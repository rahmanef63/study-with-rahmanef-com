import { api } from "@convex/_generated/api";
import { safeQuery } from "@/lib/convex-server";
import { DEFAULT_COMMUNITY_SLUG } from "@/lib/community";

export async function LandingStats() {
  const stats = await safeQuery(api.features.tenants.queries.getPublicStatsBySlug, {
    slug: DEFAULT_COMMUNITY_SLUG,
  });
  if (stats === null) return null;
  return (
    <dl className="mt-8 flex flex-wrap gap-x-8 gap-y-3">
      {[[`${stats.courseCount}`, "kelas"], [`${stats.memberCount}${stats.memberCountCapped ? "+" : ""}`, "anggota"], ["100%", "gratis"]].map(([value, label]) => (
        <div key={label}>
          <dt className="text-caption text-muted-foreground">{label}</dt>
          <dd className="font-display text-marquee text-primary">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
