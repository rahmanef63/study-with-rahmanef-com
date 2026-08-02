"use client";
// announcements slice — the connected view the integrator mounts at
// /t/[slug]/pengumuman. Reads the member list reactively and, for instructor+
// (canManage — resolved by the page from membership; UX only, the server authz
// on create is the real guard), shows the create form above the feed.
import type { Id } from "@convex/_generated/dataModel";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge, SectionHeader } from "@/components/mockup-kit";
import { cn } from "@/lib/utils";
import { AnnouncementCard } from "../components/announcement-card";
import { AnnouncementForm } from "../components/announcement-form";
import { mergeAnnouncementsCopy, type AnnouncementsCopyOverride } from "../config/copy";
import { useCreateAnnouncement } from "../hooks/use-announcement-mutations";
import { useAnnouncements } from "../hooks/use-announcements";

export type AnnouncementsViewProps = {
  tenantId: Id<"tenants">;
  /** instructor+ → render the create form. UX gate only (server authz is real). */
  canManage?: boolean;
  copy?: AnnouncementsCopyOverride;
  className?: string;
};

export function AnnouncementsView({
  tenantId,
  canManage = false,
  copy,
  className,
}: AnnouncementsViewProps) {
  const t = mergeAnnouncementsCopy(copy);
  const announcements = useAnnouncements(tenantId);
  const { createAnnouncement, isPending } = useCreateAnnouncement(copy);

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <div className="min-w-0">
        <SectionHeader
          eyebrow="Komunitas"
          title={t.title}
          className="mb-2"
          actions={
            announcements !== undefined ? (
              <Badge tone="muted">
                {announcements.length} {t.countLabel}
              </Badge>
            ) : null
          }
        />
        <p className="text-pretty text-sm text-muted-foreground">{t.subtitle}</p>
      </div>

      {canManage ? (
        <AnnouncementForm
          copy={copy}
          isPending={isPending}
          onSubmit={(values) => createAnnouncement(tenantId, values)}
        />
      ) : null}

      {announcements === undefined ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-28 w-full rounded-[var(--radius-win)]" />
          <Skeleton className="h-28 w-full rounded-[var(--radius-win)]" />
        </div>
      ) : announcements.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>{t.title}</EmptyTitle>
            <EmptyDescription>{canManage ? t.emptyManage : t.empty}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <ul className="flex flex-col gap-3">
          {announcements.map((a) => (
            <li key={a._id}>
              <AnnouncementCard announcement={a} copy={copy} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
