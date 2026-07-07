// resources slice — grid renderer shared by the Approved / Kiriman-saya tabs.
// Handles the three states (loading → skeletons, empty → message, else grid) so
// the board view stays lean.
import { BookMarked } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { ResourcesCopy } from "../config/copy";
import type { ResourceCard as ResourceCardData } from "../types";
import { BoardEmptyState } from "./board-empty-state";
import { ResourceCard } from "./resource-card";

export type ResourceGridProps = {
  items: ResourceCardData[] | undefined;
  emptyLabel: string;
  copy: ResourcesCopy;
  showStatus?: boolean;
};

export function ResourceGrid({ items, emptyLabel, copy, showStatus }: ResourceGridProps) {
  if (items === undefined) {
    return (
      <div className="grid gap-4 @sm:grid-cols-2 @lg:grid-cols-3">
        <Skeleton className="h-36" />
        <Skeleton className="hidden h-36 @sm:block" />
        <Skeleton className="hidden h-36 @lg:block" />
      </div>
    );
  }
  if (items.length === 0) {
    return (
      <BoardEmptyState
        icon={BookMarked}
        message={emptyLabel}
        cta={{ label: copy.submitResourceTitle, href: "#bagikan-sumber" }}
      />
    );
  }
  return (
    <div className="grid gap-4 @sm:grid-cols-2 @lg:grid-cols-3">
      {items.map((r) => (
        <ResourceCard key={r._id} resource={r} copy={copy} showStatus={showStatus} />
      ))}
    </div>
  );
}
