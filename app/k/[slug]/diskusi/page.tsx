import type { Metadata } from "next";
import { Suspense } from "react";
import { api } from "@convex/_generated/api";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { communityHref } from "@/lib/community";
import { safeQuery } from "@/lib/convex-server";
import { DiskusiSections } from "../_components/diskusi-sections";

// Diskusi tab. The page resolves the tenant anonymously (getPublicBySlug is on
// the etalase whitelist) purely to hand a tenantId to the client island — every
// board below it is member-gated and can only be read in the browser.
type Params = { slug: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: "Diskusi",
    description: "Pengumuman, sumber belajar, dan usulan dari anggota komunitas.",
    alternates: { canonical: communityHref.diskusi(slug) },
    // Members-only: a crawler sees the join CTA and nothing else, so indexing
    // this URL would only add a thin duplicate of the community page.
    robots: { index: false },
  };
}

async function DiskusiBody({ slug }: { slug: string }) {
  const tenant = await safeQuery(api.features.tenants.queries.getPublicBySlug, { slug });
  // An unknown slug already 404s in the layout, so null here means Convex is
  // unreachable — say so instead of rendering an empty page.
  if (tenant === null) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyTitle className="font-display">Diskusi belum bisa dimuat</EmptyTitle>
          <EmptyDescription className="text-pretty">
            Koneksi ke server sedang bermasalah. Coba muat ulang halaman ini sebentar lagi.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }
  return <DiskusiSections tenantId={tenant._id} slug={slug} />;
}

export default async function DiskusiPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  return (
    // Own boundary: the awaited etalase read is dynamic (cacheComponents).
    <Suspense fallback={<Skeleton className="h-64 w-full rounded-[var(--radius-win)]" />}>
      <DiskusiBody slug={slug} />
    </Suspense>
  );
}
