"use client";

// Tenant-home "pengumuman terbaru ringkas" (UI-UX-PRD §4). Member-gated: the
// announcements list query requires the member role, so we only query once
// membership is confirmed — non-members/loading render nothing.
import Link from "next/link";
import type { Id } from "@convex/_generated/dataModel";
import { AnnouncementCard, useAnnouncements } from "@/features/announcements";
import { useMyMembership } from "@/features/tenants";

export function TenantAnnouncementsTeaser({
  tenantId,
  slug,
}: {
  tenantId: Id<"tenants">;
  slug: string;
}) {
  const { membership } = useMyMembership(tenantId);
  const isMember = membership != null;
  const announcements = useAnnouncements(isMember ? tenantId : undefined);

  if (!isMember || !announcements || announcements.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-1">
        <span className="eyebrow">Terbaru</span>
        <h2 className="text-xl sm:text-2xl">Pengumuman</h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {announcements.slice(0, 2).map((a) => (
          <AnnouncementCard key={a._id} announcement={a} />
        ))}
      </div>
      <Link
        href={`/t/${slug}/pengumuman`}
        className="inline-flex min-h-11 items-center text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
      >
        Lihat semua pengumuman →
      </Link>
    </section>
  );
}
