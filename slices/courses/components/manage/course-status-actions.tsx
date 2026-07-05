"use client";
// courses slice — draft ↔ published → archived transitions with a status
// chip. Publish requires ≥1 lesson (server-enforced; error toasts).
import type { Id } from "@convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
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
  const label =
    status === "draft" ? copy.statusDraft : status === "published" ? copy.statusPublished : copy.statusArchived;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${CHIP_CLASSES[status]}`}>
        {label}
      </span>
      {status !== "published" && (
        <Button size="sm" onClick={() => void onSetStatus(courseId, "published")}>
          {copy.publish}
        </Button>
      )}
      {status === "published" && (
        <Button size="sm" variant="outline" onClick={() => void onSetStatus(courseId, "draft")}>
          {copy.unpublish}
        </Button>
      )}
      {status !== "archived" && (
        <Button size="sm" variant="ghost" onClick={() => void onSetStatus(courseId, "archived")}>
          {copy.archive}
        </Button>
      )}
    </div>
  );
}
