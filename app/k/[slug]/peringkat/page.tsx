import type { Metadata } from "next";
import { Suspense } from "react";
import { api } from "@convex/_generated/api";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { communityHref } from "@/lib/community";
import { safeQuery } from "@/lib/convex-server";
import { PapanSkor } from "./_components/papan-skor";

// Peringkat tab. Same shape as Anggota: one anonymous slug→tenantId resolution
// server-side, then a client island — the board is a member list, so listTop is
// requireTenantRole(member) and nothing about it may be server-rendered.
type Params = { slug: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: "Peringkat",
    description: "Papan skor komunitas — siapa yang paling aktif membantu di Diskusi.",
    alternates: { canonical: communityHref.peringkat(slug) },
    // A ranked member list is never indexed and never shown to a crawler.
    robots: { index: false },
  };
}

async function PeringkatBody({ slug }: { slug: string }) {
  const tenant = await safeQuery(api.features.tenants.queries.getPublicBySlug, { slug });
  if (tenant === null) {
    return (
      <Empty className="border-2">
        <EmptyHeader>
          <EmptyTitle className="font-display text-xs uppercase">
            Papan skor belum bisa dimuat
          </EmptyTitle>
          <EmptyDescription className="text-pretty">
            Koneksi ke server sedang bermasalah. Coba muat ulang halaman ini sebentar lagi.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }
  return <PapanSkor tenantId={tenant._id} slug={slug} />;
}

export default async function PeringkatPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <PeringkatBody slug={slug} />
    </Suspense>
  );
}
