"use client";

// Diskusi = the three member-only boards the OS shell scattered across two
// windows (pengumuman-app, resources-app with its in-window tab switch), now one
// scrollable page with linkable sections. When the real post feed lands it takes
// the top of this page and these three become its neighbours.
//
// Client by necessity: announcements.list, resources.* and suggestions.* are all
// requireTenantRole(member), and server components here are permanently
// anonymous.
import type { Id } from "@convex/_generated/dataModel";
import { AnnouncementsView } from "@/features/announcements";
import { ResourceBoardView, SuggestionBoxView } from "@/features/resources";
import { useMyMembership } from "@/features/tenants";
import { Skeleton } from "@/components/ui/skeleton";
import { communityHref } from "@/lib/community";
import { GabungDulu } from "./gabung-dulu";

const SECTIONS = [
  { id: "pengumuman", label: "Pengumuman" },
  { id: "sumber", label: "Sumber belajar" },
  { id: "usulan", label: "Usulan" },
] as const;

export function DiskusiSections({
  tenantId,
  slug,
}: {
  tenantId: Id<"tenants">;
  slug: string;
}) {
  const { membership, isAuthenticated, isAuthLoading } = useMyMembership(tenantId);
  // UX gate only — create/curate/setStatus each re-check instructor+ server-side.
  const canManage = membership?.role === "instructor" || membership?.role === "owner";

  if (isAuthLoading || (isAuthenticated && membership === undefined)) {
    return (
      <div className="space-y-4" aria-busy>
        <span className="sr-only">Memuat diskusi…</span>
        <Skeleton className="h-28 w-full rounded-[var(--radius-win)]" />
        <Skeleton className="h-64 w-full rounded-[var(--radius-win)]" />
      </div>
    );
  }

  if (!isAuthenticated || membership === null) {
    return (
      <GabungDulu
        tenantId={tenantId}
        nextHref={communityHref.diskusi(slug)}
        title="Gabung dulu untuk ikut diskusi"
        description="Pengumuman, papan sumber belajar, dan kotak usulan terbuka untuk anggota komunitas."
      />
    );
  }

  return (
    <div className="space-y-12">
      {/* Plain in-page anchors: the sections are deep-linked from notifications
          and from the retired /pengumuman + /resources redirects. */}
      <nav aria-label="Bagian diskusi" className="flex flex-wrap gap-2">
        {SECTIONS.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="inline-flex min-h-9 items-center border border-border px-3 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
          >
            {s.label}
          </a>
        ))}
      </nav>

      {/* scroll-mt clears the community header when an anchor is followed. */}
      <section id="pengumuman" className="scroll-mt-24">
        <AnnouncementsView tenantId={tenantId} canManage={canManage} />
      </section>
      <section id="sumber" className="scroll-mt-24">
        <ResourceBoardView tenantId={tenantId} canModerate={canManage} />
      </section>
      <section id="usulan" className="scroll-mt-24">
        <SuggestionBoxView tenantId={tenantId} canModerate={canManage} />
      </section>
    </div>
  );
}
