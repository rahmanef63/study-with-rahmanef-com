import { cn } from "@/lib/utils";
import { EmptyState, type EmptyStateProps } from "./EmptyState";

export type ErrorPageProps = EmptyStateProps;

/**
 * Full-page wrapper around {@link EmptyState} for route-level drop-ins
 * (`app/not-found.tsx`, `app/error.tsx`). Centers the state in the viewport.
 */
export function ErrorPage({ className, ...props }: ErrorPageProps) {
  return (
    <main
      className={cn(
        "min-h-[60vh] grid place-items-center px-4 py-12",
        className,
      )}
    >
      <div className="w-full max-w-md">
        <EmptyState {...props} />
      </div>
    </main>
  );
}
