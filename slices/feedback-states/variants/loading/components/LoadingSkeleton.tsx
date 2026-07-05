import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { LOADING_PRESETS, type LoadingKind } from "./presets";

export interface LoadingSkeletonProps {
  /** Preset shape. Default `"text"`. */
  kind?: LoadingKind;
  /** Repeat count for row/line kinds (text lines, list rows, table rows,
   *  form fields). Defaults per kind — see `LOADING_PRESETS`. */
  count?: number;
  /** Column count for the `table` kind. Default 4. */
  columns?: number;
  className?: string;
}

/** Last line renders shorter so the block reads as prose, not a grid. */
function TextLines({ count }: { count: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }, (_, i) => (
        <Skeleton
          key={i}
          className={cn("h-4", i === count - 1 ? "w-2/3" : "w-full")}
        />
      ))}
    </div>
  );
}

function CardShape({ count }: { count: number }) {
  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="flex items-center gap-3">
        <Skeleton className="size-10 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/4" />
        </div>
      </div>
      <TextLines count={Math.max(2, count + 1)} />
    </div>
  );
}

function ListRows({ count }: { count: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="size-9 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="h-3 w-3/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

function TableRows({ count, columns }: { count: number; columns: number }) {
  return (
    <div className="overflow-hidden rounded-lg border">
      <div className="flex gap-4 border-b bg-muted/40 px-4 py-3">
        {Array.from({ length: columns }, (_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {Array.from({ length: count }, (_, r) => (
        <div key={r} className="flex gap-4 border-b px-4 py-3 last:border-b-0">
          {Array.from({ length: columns }, (_, c) => (
            <Skeleton key={c} className={cn("h-4 flex-1", c === 0 && "w-1/2")} />
          ))}
        </div>
      ))}
    </div>
  );
}

function FormFields({ count }: { count: number }) {
  return (
    <div className="space-y-5">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-full rounded-md" />
        </div>
      ))}
      <Skeleton className="h-9 w-28 rounded-md" />
    </div>
  );
}

/** Generic page body — title strip, prose lines, two-card grid, tall
 *  block. Drop straight into a route `loading.tsx`. */
function PageShape() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-72" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-11/12" />
      <Skeleton className="h-4 w-9/12" />
      <div className="grid gap-3 sm:grid-cols-2">
        <Skeleton className="h-24 rounded-lg" />
        <Skeleton className="h-24 rounded-lg" />
      </div>
      <Skeleton className="h-48 rounded-lg" />
    </div>
  );
}

/**
 * One configurable skeleton component with per-kind presets — the SSOT
 * for loading placeholders. Composes the shadcn `Skeleton` primitive.
 *
 * `text | card | list | table | form | page | block` — pick the shape
 * that mirrors the content being streamed, override `count`/`columns`
 * where the default density doesn't fit.
 */
export function LoadingSkeleton({
  kind = "text",
  count,
  columns = 4,
  className,
}: LoadingSkeletonProps) {
  const n = count ?? LOADING_PRESETS[kind].count;
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className={cn("w-full", className)}
    >
      {kind === "text" && <TextLines count={n} />}
      {kind === "card" && <CardShape count={n} />}
      {kind === "list" && <ListRows count={n} />}
      {kind === "table" && <TableRows count={n} columns={columns} />}
      {kind === "form" && <FormFields count={n} />}
      {kind === "page" && <PageShape />}
      {kind === "block" && <Skeleton className="h-full min-h-24 w-full rounded-lg" />}
    </div>
  );
}
