// notifications slice — warm empty state (pattern: comments-empty-state).
// Presentational only.
import { ART_SIZE } from "@/lib/art";

export type NotificationsEmptyStateProps = {
  title: string;
  hint: string;
  /** Overridable by the host; the default is the empty-inbox sprite. */
  art?: string;
};

export function NotificationsEmptyState({
  title,
  hint,
  art = "/ui/empty/notifications.webp",
}: NotificationsEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-10 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element -- committed static asset. */}
      <img
        src={art}
        alt=""
        width={ART_SIZE.media}
        height={ART_SIZE.media}
        loading="lazy"
        decoding="async"
        className="pixelated size-24 object-contain"
      />
      <div className="space-y-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="max-w-xs text-sm text-muted-foreground">{hint}</p>
      </div>
    </div>
  );
}
