import type { Metadata } from "next";
import { PageHeading } from "../_components/page-heading";
import { CariSurface } from "./cari-surface";

// Per-community search over published course titles and lesson content.
// Member-gated server-side (useTenantSearch → requireTenantRole), so the whole
// page is a client island and is never indexed.
//
// NOT in COMMUNITY_TABS, but it IS a rail row: search used to hang off the
// desktop brand row AND off the phone "Lainnya" sheet — reachable by two
// different accidents — and both are gone. `communityToolLinks()` in
// components/shell/nav-model.ts puts it in the one list instead. There is no
// global /cari; that path 404s.
export const metadata: Metadata = { title: "Cari", robots: { index: false } };

export default async function CariPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <div className="@container space-y-6">
      {/* One heading idiom for every page under /k. The eyebrow "Pencarian"
          went with the swap: it was a synonym of the title directly beneath it.
          The description survives — this is one of the two pages where the
          title genuinely is not enough (what gets searched, and that drafts do
          not). mb-0 because the wrapper's space-y-6 owns the gap. */}
      <PageHeading
        title="Cari"
        description="Telusuri judul kelas dan isi materi di komunitas ini — yang sudah terbit saja."
        className="mb-0"
      />
      <CariSurface slug={slug} />
    </div>
  );
}
