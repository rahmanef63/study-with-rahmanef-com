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
      <header className="flex flex-col gap-2 border-b pb-5">
        <span className="eyebrow">Komunitas</span>
        <h1 className="text-2xl sm:text-3xl">{t.title}</h1>
        <p className="text-pretty text-sm text-muted-foreground">{t.subtitle}</p>
      </header>

      {canManage ? (
        <AnnouncementForm
          copy={copy}
          isPending={isPending}
          onSubmit={(values) => createAnnouncement(tenantId, values)}
        />
      ) : null}

      {announcements === undefined ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
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
