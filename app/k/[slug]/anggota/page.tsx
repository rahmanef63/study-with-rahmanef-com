import type { Metadata } from "next";
import { Suspense } from "react";
import { api } from "@convex/_generated/api";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { communityHref } from "@/lib/community";
import { safeQuery } from "@/lib/convex-server";
import { AnggotaRoster } from "../_components/anggota-roster";
import { PageHeading } from "../_components/page-heading";

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
      <Empty className="gap-4 border p-5 md:p-8">
        <EmptyHeader className="gap-1.5">
          <EmptyTitle className="font-display">
            Anggota belum bisa dimuat
          </EmptyTitle>
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
    <>
      {/* The roster deliberately renders no header of its own (see
          ../_components/anggota-roster.tsx); this is the one place the page is
          named, and outside the boundary so it paints before the list does. */}
      <PageHeading title="Anggota" />
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <AnggotaBody slug={slug} />
      </Suspense>
    </>
  );
}
