// notifications slice — warm empty state (pattern: comments-empty-state).
// Presentational only.
import { BellOff } from "lucide-react";

export type NotificationsEmptyStateProps = {
  title: string;
  hint: string;
};

export function NotificationsEmptyState({ title, hint }: NotificationsEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-10 text-center">
      <span
        className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground"
        aria-hidden
      >
        <BellOff className="size-5" />
      </span>
      <div className="space-y-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="max-w-xs text-sm text-muted-foreground">{hint}</p>
      </div>
    </div>
  );
}
