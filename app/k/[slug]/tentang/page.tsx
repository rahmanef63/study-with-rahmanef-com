import type { Metadata } from "next";
import { Suspense } from "react";
import { BookOpen, ExternalLink, Users } from "lucide-react";
import { api } from "@convex/_generated/api";
import { Badge, StatTile } from "@/components/mockup-kit";
import { CourseCover } from "@/features/courses";
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
      {/* Procedural cabinet art, the same generator the course cards use. The
          seeds used to point this at picsum.photos — a third-party stock host
          inside a product whose first law is zero running cost, dropping a
          blurry photo of pencils on top of a pixel-art cabinet. An owner URL
          still wins; the default is now on-brand and costs nothing. */}
      <CourseCover
        slug={tenant.slug}
        src={tenant.coverImageUrl}
        className="hidden h-40 w-full border-2 border-border @md:block @md:h-56"
      />

      <div className="space-y-3">
        {/* No title here. The community name is already the <h1> pinned to the
            top of the screen on phone and the header h1 on desktop; repeating
            it 266px below was the same fact rendered twice. The eyebrow keeps
            the section labelled. */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="eyebrow">Tentang komunitas</span>
          {tenant.track ? <Badge tone="accent">Track: {tenant.track}</Badge> : null}
        </div>
        <p className="max-w-2xl whitespace-pre-line text-pretty text-muted-foreground">
          {tenant.description}
        </p>
      </div>

      {/* Counts are in the nav subtitle on phone ("7 anggota · 6 kelas"), so the
          tiles are desktop-only — on a phone they were a third rendering of two
          numbers already on screen. */}
      {stats !== null ? (
        <div className="hidden gap-3 @sm:grid @sm:grid-cols-2">
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
