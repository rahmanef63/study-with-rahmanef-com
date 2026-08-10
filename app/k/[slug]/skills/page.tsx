import type { Metadata } from "next";
import { Suspense } from "react";
import { api } from "@convex/_generated/api";
import { SkillsLibraryView } from "@/features/materi";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { communityHref } from "@/lib/community";
import { safeQuery } from "@/lib/convex-server";
import { GabungDulu } from "../_components/gabung-dulu";

// Skills tab — the community's prompt library.
//
// Same shape as the Materi tab it is a sibling of (a skill IS a materi with
// `kind: "skill"`): ONE anonymous slug→tenantId resolution server-side, then a
// client island, because listLibrary/listTags/searchSkills are all
// requireTenantRole(member). Nothing about the list may be server-rendered,
// and nothing about it should be indexed — a catalogue of every prompt in a
// community is the single most copyable thing the product has, and it is
// exactly what membership buys. The individual SKILL PAGES are the indexable
// surface, and even they stop at the title (see ./[lessonSlug]/page.tsx).
type Params = { slug: string };
type Search = { tag?: string | string[] };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: "Skills",
    description:
      "Kumpulan prompt siap pakai milik komunitas — salin, tempel ke AI-nya, langsung jalan.",
    alternates: { canonical: communityHref.skills(slug) },
    // Member-gated list. The skill permalinks are what gets indexed.
    robots: { index: false },
  };
}

/** `?tag=` may legally arrive repeated; take the first and let the server
 *  normalise it (an unmatchable filter answers an empty page, not an error). */
function firstTag(tag: Search["tag"]): string | null {
  if (tag === undefined) return null;
  return Array.isArray(tag) ? (tag[0] ?? null) : tag;
}

async function SkillsBody({ slug, tag }: { slug: string; tag: string | null }) {
  const tenant = await safeQuery(api.features.tenants.queries.getPublicBySlug, { slug });
  if (tenant === null) {
    return (
      <Empty className="gap-4 border-2 p-5 md:p-8">
        <EmptyHeader className="gap-1.5">
          <EmptyTitle className="font-display text-xs uppercase leading-relaxed">
            Skills belum bisa dimuat
          </EmptyTitle>
          <EmptyDescription className="text-pretty">
            Koneksi ke server sedang bermasalah. Coba muat ulang halaman ini sebentar lagi.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }
  return (
    <SkillsLibraryView
      tenantId={tenant._id}
      tenantSlug={slug}
      initialTag={tag}
      // A STRING, not a builder — a function prop cannot cross the
      // server→client boundary, and that mistake has taken this app down three
      // times. The empty state shows this door to instructor+ only.
      kelolaHref={communityHref.kelola(slug)}
      gate={
        <GabungDulu
          tenantId={tenant._id}
          nextHref={communityHref.skills(slug)}
          description="Kumpulan prompt komunitas hanya terbuka untuk anggota."
        />
      }
    />
  );
}

export default async function SkillsPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<Search>;
}) {
  const [{ slug }, search] = await Promise.all([params, searchParams]);
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <SkillsBody slug={slug} tag={firstTag(search.tag)} />
    </Suspense>
  );
}
