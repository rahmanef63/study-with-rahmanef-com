"use client";

// Kelola — shared UI atoms for the console tabs (loading, empty/denied, and
// the drill-down row + back button both the Kelas and Kuis tabs navigate with).
// components/ui/empty for empty/denied, skeletons for load. No data or CRUD.
import type { ReactNode } from "react";
import { ArrowLeft, ChevronRight, Inbox, type LucideIcon } from "lucide-react";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Button } from "@/components/ui/button";
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

/** One drill-down row (pick a kelas, pick a kuis). 44px tap target on phones. */
export function KelolaRow({
  icon: Icon,
  label,
  meta,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  meta?: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-11 w-full items-center gap-3 border bg-card px-4 py-3 text-left transition-colors hover:border-primary/40 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="grid size-9 shrink-0 place-items-center bg-primary/10 text-primary">
        <Icon className="size-4" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{label}</span>
        {meta ? <span className="block truncate text-xs text-muted-foreground">{meta}</span> : null}
      </span>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
    </button>
  );
}

export function KelolaBack({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-2 min-h-11 text-muted-foreground @sm:min-h-9"
      onClick={onClick}
    >
      <ArrowLeft aria-hidden /> {label}
    </Button>
  );
}
