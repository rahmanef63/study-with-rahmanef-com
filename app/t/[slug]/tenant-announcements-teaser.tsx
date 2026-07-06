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
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Pengumuman terbaru</h2>
      <div className="grid gap-3">
        {announcements.slice(0, 2).map((a) => (
          <AnnouncementCard key={a._id} announcement={a} />
        ))}
      </div>
      <Link
        href={`/t/${slug}/pengumuman`}
        className="inline-block text-sm font-medium text-primary hover:underline"
      >
        Lihat semua pengumuman →
      </Link>
    </section>
  );
}
