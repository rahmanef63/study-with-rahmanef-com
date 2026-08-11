import type { Metadata } from "next";
import { Suspense } from "react";
import { api } from "@convex/_generated/api";
import { MateriLibraryView } from "@/features/materi";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { communityHref } from "@/lib/community";
import { safeQuery } from "@/lib/convex-server";
import { GabungDulu } from "../_components/gabung-dulu";
import { PageHeading } from "../_components/page-heading";

// Materi tab — the community's whole library of teaching material.
//
// Same shape as Anggota and Peringkat: ONE anonymous slug→tenantId resolution
// server-side, then a client island, because listLibrary/listTags are both
// requireTenantRole(member). Nothing about the list may be server-rendered,
// and nothing about it should be indexed — a catalogue of every materi in a
// community is exactly what membership buys. The individual materi PAGES are
// the indexable surface (see ./[lessonSlug]/page.tsx).
type Params = { slug: string };
type Search = { tag?: string | string[] };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: "Materi",
    description: "Perpustakaan materi komunitas — semua bahan belajar, bisa dipakai lintas kelas.",
    alternates: { canonical: communityHref.materi(slug) },
    // Member-gated list. The materi permalinks are what gets indexed.
    robots: { index: false },
  };
}

/** `?tag=` may legally arrive repeated; take the first and let the server
 *  normalise it (an unmatchable filter answers an empty page, not an error). */
function firstTag(tag: Search["tag"]): string | null {
  if (tag === undefined) return null;
  return Array.isArray(tag) ? (tag[0] ?? null) : tag;
}

async function MateriBody({ slug, tag }: { slug: string; tag: string | null }) {
  const tenant = await safeQuery(api.features.tenants.queries.getPublicBySlug, { slug });
  if (tenant === null) {
    return (
      <Empty className="gap-4 border-2 p-5 md:p-8">
        <EmptyHeader className="gap-1.5">
          <EmptyTitle className="font-display text-xs uppercase leading-relaxed">
            Materi belum bisa dimuat
          </EmptyTitle>
          <EmptyDescription className="text-pretty">
            Koneksi ke server sedang bermasalah. Coba muat ulang halaman ini sebentar lagi.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }
  return (
    <MateriLibraryView
      tenantId={tenant._id}
      tenantSlug={slug}
      initialTag={tag}
      // A ReactNode crosses the boundary; a function prop would not.
      gate={
        <GabungDulu
          tenantId={tenant._id}
          nextHref={communityHref.materi(slug)}
          description="Perpustakaan materi komunitas hanya terbuka untuk anggota."
        />
      }
    />
  );
}

export default async function MateriPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<Search>;
}) {
  const [{ slug }, search] = await Promise.all([params, searchParams]);
  return (
    <>
      {/* Outside the boundary: the title is a constant, so it must not wait on
          a Convex round trip the way the list does. It is also the only thing
          naming this screen below md, where the rail is behind a hamburger. */}
      <PageHeading title="Materi" />
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <MateriBody slug={slug} tag={firstTag(search.tag)} />
      </Suspense>
    </>
  );
}
