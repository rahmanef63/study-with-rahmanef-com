import type { Metadata } from "next";
import { Suspense } from "react";
import { api } from "@convex/_generated/api";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { communityHref } from "@/lib/community";
import { safeQuery } from "@/lib/convex-server";
import { AnggotaRoster } from "../_components/anggota-roster";

// Anggota tab. Same shape as Diskusi: an anonymous slug→tenantId resolution
// server-side, then a client island, because listMembers is member-gated (it
// must be — the roster carries usernames).
type Params = { slug: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: "Anggota",
    description: "Anggota komunitas dan sejak kapan mereka bergabung.",
    alternates: { canonical: communityHref.anggota(slug) },
    // Member data — never indexed, never shown to a crawler.
    robots: { index: false },
  };
}

async function AnggotaBody({ slug }: { slug: string }) {
  const tenant = await safeQuery(api.features.tenants.queries.getPublicBySlug, { slug });
  if (tenant === null) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyTitle className="font-serif">Anggota belum bisa dimuat</EmptyTitle>
          <EmptyDescription className="text-pretty">
            Koneksi ke server sedang bermasalah. Coba muat ulang halaman ini sebentar lagi.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }
  return <AnggotaRoster tenantId={tenant._id} slug={slug} />;
}

export default async function AnggotaPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full rounded-[var(--radius-win)]" />}>
      <AnggotaBody slug={slug} />
    </Suspense>
  );
}
