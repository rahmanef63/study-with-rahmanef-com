import type { Metadata } from "next";
import { cache, Suspense } from "react";
import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { api } from "@convex/_generated/api";
import { TombolBagikan } from "@/components/tombol-bagikan";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { communityHref } from "@/lib/community";
import { absoluteUrl, safeQuery } from "@/lib/convex-server";
import { AgendaMendatang, ArsipAcara } from "./_components/daftar-acara";
import { PanelJadwal } from "./_components/panel-jadwal";
import { PageHeading } from "../_components/page-heading";
import { kalenderHref, labelHari, labelRentang } from "./_components/acara-lib";

// Kalender — the community's live cadence, SERVER-rendered and indexable.
//
// publicListUpcoming / publicListPast are on the anonymous etalase whitelist
// (AGENTS.md §6), so unlike Diskusi and Anggota this tab is not a client island
// behind a gate: "this community actually meets, here is when" is exactly the
// discovery signal a public calendar exists to send, and it has to survive both
// a crawler and a WhatsApp unfurl. The JOIN LINK is the one member-only bit and
// it lives in its own island (tautan-gabung.tsx).
type Params = { slug: string };

// cache(): generateMetadata and the body need the same three reads, and
// fetchQuery has no per-request dedupe of its own.
const muatKalender = cache(async (slug: string) => {
  const tenant = await safeQuery(api.features.tenants.queries.getPublicBySlug, { slug });
  if (tenant === null) return null;
  const [mendatang, lampau] = await Promise.all([
    safeQuery(api.features.events.queries.publicListUpcoming, { tenantId: tenant._id }),
    safeQuery(api.features.events.queries.publicListPast, { tenantId: tenant._id }),
  ]);
  return { tenant, mendatang: mendatang ?? [], lampau: lampau ?? [] };
});

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await muatKalender(slug);
  if (data === null) return { title: "Kalender", robots: { index: false } };

  const berikutnya = data.mendatang[0];
  const description =
    berikutnya === undefined
      ? `Jadwal sesi live ${data.tenant.name}. Belum ada sesi terjadwal saat ini.`
      : `${data.mendatang.length} sesi live di ${data.tenant.name}. Berikutnya: ${berikutnya.title} — ${labelHari(berikutnya.startsAt)}, ${labelRentang(berikutnya.startsAt, berikutnya.endsAt)}.`;
  const title = `Kalender ${data.tenant.name}`;

  return {
    title: "Kalender",
    description,
    alternates: { canonical: kalenderHref(slug) },
    openGraph: {
      type: "website",
      title,
      description,
      url: absoluteUrl(kalenderHref(slug)),
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

function KalenderKosong({ slug }: Params) {
  return (
    // No upcoming session is the NORMAL resting state of a small community, not
    // a failure — so this reads as a signpost, never as a broken page.
    <Empty className="border-2 border-dashed">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <CalendarDays aria-hidden />
        </EmptyMedia>
        <EmptyTitle className="font-display text-xs uppercase">Belum ada sesi terjadwal</EmptyTitle>
        <EmptyDescription className="text-pretty">
          Sesi live diumumkan dulu di Discord komunitas, baru muncul di sini. Link undangannya ada
          di halaman Tentang.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button asChild variant="outline" className="min-h-11 @sm:min-h-9">
          <Link href={communityHref.tentang(slug)}>Lihat Tentang &amp; Discord</Link>
        </Button>
      </EmptyContent>
    </Empty>
  );
}

async function IsiKalender({ slug }: Params) {
  const data = await muatKalender(slug);
  if (data === null) {
    return (
      <Empty className="border-2 border-dashed">
        <EmptyHeader>
          <EmptyTitle className="font-display text-xs uppercase">
            Kalender belum bisa dimuat
          </EmptyTitle>
          <EmptyDescription className="text-pretty">
            Koneksi ke server sedang bermasalah. Coba muat ulang halaman ini sebentar lagi.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  const { tenant, mendatang, lampau } = data;
  return (
    <div className="space-y-8">
      {/* <PageHeading/>, not <SectionHeader/>: this is the PAGE's title, and
          every other section under /k now says its name the same way. The
          eyebrow "Papan jadwal" went with the swap — two labels for one screen,
          one of them a synonym of the other. The share button stays, which is
          why the heading lives in here with the tenant rather than above the
          boundary: it needs the community name. */}
      <PageHeading
        title="Kalender"
        actions={
          <TombolBagikan
            url={absoluteUrl(kalenderHref(slug))}
            title={`Kalender ${tenant.name}`}
            text="Jadwal sesi live komunitas."
          />
        }
      />
      <PanelJadwal tenantId={tenant._id} />
      {mendatang.length === 0 ? (
        <KalenderKosong slug={slug} />
      ) : (
        <AgendaMendatang tenantId={tenant._id} slug={slug} acara={mendatang} />
      )}
      <ArsipAcara tenantId={tenant._id} slug={slug} acara={lampau} />
    </div>
  );
}

export default async function KalenderPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  return (
    // Own boundary: the three awaited etalase reads are dynamic.
    <Suspense fallback={<Skeleton className="h-72 w-full" />}>
      <IsiKalender slug={slug} />
    </Suspense>
  );
}
