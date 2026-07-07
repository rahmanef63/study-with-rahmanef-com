"use client";
// courses slice — draft ↔ published → archived transitions with a status
// chip. Publish requires ≥1 lesson (server-enforced; error toasts).
import { useState } from "react";
import type { Id } from "@convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { CoursesCopy } from "../../config/copy";
import type { CourseStatus } from "../../types";

export type CourseStatusActionsProps = {
  courseId: Id<"courses">;
  status: CourseStatus;
  onSetStatus: (courseId: Id<"courses">, status: CourseStatus) => Promise<unknown>;
  copy: CoursesCopy;
};

const CHIP_CLASSES: Record<CourseStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  published: "bg-primary/10 text-primary",
  archived: "bg-destructive/10 text-destructive",
};

export function CourseStatusActions({ courseId, status, onSetStatus, copy }: CourseStatusActionsProps) {
  // Track which transition is in flight so we can disable the whole set and
  // spin only the active button (mirrors the queue view's isPending gating).
  const [pending, setPending] = useState<CourseStatus | null>(null);
  const busy = pending !== null;
  const label =
    status === "draft" ? copy.statusDraft : status === "published" ? copy.statusPublished : copy.statusArchived;

  const run = async (target: CourseStatus) => {
    setPending(target);
    try {
      await onSetStatus(courseId, target);
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${CHIP_CLASSES[status]}`}>
        {label}
      </span>
      {status !== "published" && (
        <Button size="sm" className="min-h-11 sm:min-h-8" disabled={busy} onClick={() => void run("published")}>
          {pending === "published" && <Spinner />}
          {copy.publish}
        </Button>
      )}
      {status === "published" && (
        <Button size="sm" variant="outline" className="min-h-11 sm:min-h-8" disabled={busy} onClick={() => void run("draft")}>
          {pending === "draft" && <Spinner />}
          {copy.unpublish}
        </Button>
      )}
      {status !== "archived" && (
        <Button size="sm" variant="ghost" className="min-h-11 sm:min-h-8" disabled={busy} onClick={() => void run("archived")}>
          {pending === "archived" && <Spinner />}
          {copy.archive}
        </Button>
      )}
    </div>
  );
}
