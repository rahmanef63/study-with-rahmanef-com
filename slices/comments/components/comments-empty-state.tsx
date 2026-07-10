// comments slice — warm empty state (pattern: resources board-empty-state).
// Presentational only.
import { MessagesSquare } from "lucide-react";

export type CommentsEmptyStateProps = {
  title: string;
  hint: string;
};

export function CommentsEmptyState({ title, hint }: CommentsEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-[var(--radius-win)] border border-dashed border-border bg-muted/30 px-6 py-10 text-center">
      <span
        className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground"
        aria-hidden
      >
        <MessagesSquare className="size-5" />
      </span>
      <div className="space-y-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="max-w-xs text-sm text-muted-foreground">{hint}</p>
      </div>
    </div>
  );
}
