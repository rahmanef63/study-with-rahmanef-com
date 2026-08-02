"use client";
// resources slice — instructor pending-review queue (loading / empty / list).
// Wraps ResourceReviewRow so the board view stays lean.
import { Inbox } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Id } from "@convex/_generated/dataModel";
import type { ResourcesCopy } from "../config/copy";
import type { ResourceReviewItem } from "../types";
import { BoardEmptyState } from "./board-empty-state";
import { ResourceReviewRow } from "./resource-review-row";

export type ResourceReviewListProps = {
  items: ResourceReviewItem[] | undefined;
  // Return value ignored; a void return type still accepts a Promise-returning
  // handler.
  onCurate: (resourceId: Id<"resources">, decision: "approved" | "rejected") => void;
  pending: boolean;
  copy: ResourcesCopy;
};

export function ResourceReviewList({ items, onCurate, pending, copy }: ResourceReviewListProps) {
  if (items === undefined) {
    return (
      <div className="grid gap-3 @4xl:grid-cols-2">
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
      </div>
    );
  }
  if (items.length === 0) {
    return <BoardEmptyState icon={Inbox} message={copy.emptyPending} />;
  }
  return (
    <div className="grid gap-3 @4xl:grid-cols-2">
      {items.map((item) => (
        <ResourceReviewRow
          key={item._id}
          item={item}
          onApprove={() => onCurate(item._id, "approved")}
          onReject={() => onCurate(item._id, "rejected")}
          pending={pending}
          copy={copy}
        />
      ))}
    </div>
  );
}
