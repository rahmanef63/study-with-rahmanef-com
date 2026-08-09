import type { Metadata } from "next";
import { Suspense } from "react";
import { BookOpen, ExternalLink, Users } from "lucide-react";
import { api } from "@convex/_generated/api";
import { Badge, SectionHeader, StatTile } from "@/components/mockup-kit";
import { TombolBagikan } from "@/components/tombol-bagikan";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { communityHref } from "@/lib/community";
import { absoluteUrl, safeQuery } from "@/lib/convex-server";
import { BantuanSection } from "../_components/bantuan-section";

// Tentang — the only fully public tab. Both reads are on the anonymous etalase
// whitelist, so this renders as real HTML for crawlers and for the WhatsApp
// unfurl; the OS shell had no equivalent surface at all.
type Params = { slug: string };

async function getTenant(slug: string) {
  return safeQuery(api.features.tenants.queries.getPublicBySlug, { slug });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tenant = await getTenant(slug);
  if (tenant === null) return { title: "Tentang", robots: { index: false } };
  const title = `Tentang ${tenant.name}`;
  return {
    title: "Tentang",
    description: tenant.description,
    alternates: { canonical: communityHref.tentang(slug) },
    openGraph: {
      type: "website",
      title,
      description: tenant.description,
      url: absoluteUrl(communityHref.tentang(slug)),
    },
    twitter: { card: "summary_large_image", title, description: tenant.description },
  };
}

async function TentangBody({ slug }: { slug: string }) {
  const [tenant, stats] = await Promise.all([
    getTenant(slug),
    safeQuery(api.features.tenants.queries.getPublicStatsBySlug, { slug }),
  ]);
  if (tenant === null) {
    return (
      <p className="rounded-[var(--radius-win)] border border-dashed bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
        Profil komunitas belum bisa dimuat. Coba muat ulang sebentar lagi.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {tenant.coverImageUrl ? (
        // Plain <img>: covers are owner-supplied URLs on arbitrary hosts and
        // next.config.mjs only allowlists images.unsplash.com for next/image.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={tenant.coverImageUrl}
          alt=""
          loading="lazy"
          decoding="async"
          className="h-40 w-full rounded-[var(--radius-win)] border border-border object-cover @md:h-56"
        />
      ) : null}

      <div className="space-y-3">
        <SectionHeader
          eyebrow="Tentang komunitas"
          title={tenant.name}
          actions={tenant.track ? <Badge tone="accent">Track: {tenant.track}</Badge> : undefined}
        />
        <p className="max-w-2xl whitespace-pre-line text-pretty text-muted-foreground">
          {tenant.description}
        </p>
      </div>

      {stats !== null ? (
        <div className="grid gap-3 @sm:grid-cols-2">
          <StatTile
            icon={<Users className="size-5" aria-hidden />}
            label="Anggota"
            value={`${stats.memberCount}${stats.memberCountCapped ? "+" : ""}`}
          />
          <StatTile
            icon={<BookOpen className="size-5" aria-hidden />}
            label="Kelas terbit"
            value={stats.courseCount}
          />
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        {tenant.discordInviteUrl ? (
          <Button variant="outline" asChild className="min-h-11 @sm:min-h-9">
            <a href={tenant.discordInviteUrl} target="_blank" rel="noopener noreferrer">
              Ngobrol &amp; jadwal live di Discord
              <ExternalLink aria-hidden className="size-4" />
            </a>
          </Button>
        ) : null}
        <TombolBagikan
          url={absoluteUrl(communityHref.tentang(slug))}
          title={tenant.name}
          text={tenant.description}
        />
      </div>
    </div>
  );
}

export default async function TentangPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  return (
    <div className="space-y-12">
      {/* Own boundary: the two awaited etalase reads are dynamic. Bantuan below
          is static and prerenders regardless of Convex. */}
      <Suspense fallback={<Skeleton className="h-64 w-full rounded-[var(--radius-win)]" />}>
        <TentangBody slug={slug} />
      </Suspense>
      <BantuanSection />
    </div>
  );
}
