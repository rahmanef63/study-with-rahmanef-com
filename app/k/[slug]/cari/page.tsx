import type { Metadata } from "next";
import { CariSurface } from "./cari-surface";

// Per-community search over published course titles and lesson content.
// Member-gated server-side (useTenantSearch → requireTenantRole), so the whole
// page is a client island and is never indexed. Not a tab: search is a tool you
// reach for, not a place you visit, so it hangs off the community header.
export const metadata: Metadata = { title: "Cari", robots: { index: false } };

export default async function CariPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <div className="@container space-y-6">
      <header className="space-y-1">
        <span className="eyebrow">Pencarian</span>
        <h2 className="font-display text-base">Cari kelas &amp; materi</h2>
        <p className="text-pretty text-sm text-muted-foreground">
          Telusuri judul kelas dan isi materi di komunitas ini — yang sudah terbit saja.
        </p>
      </header>
      <CariSurface slug={slug} />
    </div>
  );
}
