"use client";
// Kelola — shared UI atoms for the console tabs (loading + empty/denied).
// Editorial styling per beranda-app: `.eyebrow` kickers, skeletons for load,
// components/ui/empty for empty/denied. No data or CRUD here.
import type { ReactNode } from "react";
import { Inbox, type LucideIcon } from "lucide-react";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";

export function KelolaSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-4">
      <Skeleton className="h-9 w-1/2" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className="h-20 w-full" />
      ))}
    </div>
  );
}

export function KelolaEmpty({
  icon: Icon = Inbox,
  title,
  body,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Icon aria-hidden />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        {body ? <EmptyDescription className="text-pretty">{body}</EmptyDescription> : null}
      </EmptyHeader>
      {action ? <EmptyContent>{action}</EmptyContent> : null}
    </Empty>
  );
}
