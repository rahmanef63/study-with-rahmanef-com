import { Skeleton } from "@/components/ui/skeleton";

/**
 * The router's dead window on the shelled account surfaces — the gap between
 * the tap and the first RSC chunk, which this app had no fallback for anywhere
 * until app/k/[slug]/loading.tsx. Measured on the shipped build: 88–476ms, and
 * for all of it the OLD page sat there un-acknowledged.
 *
 * Its own module, not a second export of account-shell.tsx: that file imports
 * the two client components of the chrome, and a `loading.tsx` re-exporting
 * from it would drag the rail and the Sheet into every loading chunk for a
 * boundary that renders four rectangles.
 *
 * The rail, the phone bar and the reading column live in the layout, so only
 * the content pane swaps — which is what makes this read as a section loading
 * rather than as the app opening a second time.
 */
export function AccountLoading() {
  return (
    <div className="space-y-4" aria-busy="true">
      <span className="sr-only">Memuat…</span>
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-6 w-56" />
      <Skeleton className="h-4 w-full max-w-md" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}
