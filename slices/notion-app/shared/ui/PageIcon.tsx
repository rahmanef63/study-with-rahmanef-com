/** Minimal page-icon renderer — the cluster's decoupled stand-in for
 *  notion-page-clone's `@/shared/components/icon-picker` DynamicIcon (a full
 *  emoji/twemoji/lucide/phosphor system). Notion page icons are overwhelmingly
 *  emoji, so we render the value as text; a `lucide:Name` token falls back to
 *  the default glyph. A host wanting rich icons can swap this later. */
export function PageIcon({
  value,
  fallback = "📄",
  className,
}: {
  value?: string | null;
  fallback?: string;
  className?: string;
}) {
  const raw = value && value.trim() ? value : fallback;
  const display = raw.startsWith("lucide:") || raw.startsWith("phosphor:") ? fallback : raw;
  return (
    <span className={className} aria-hidden>
      {display}
    </span>
  );
}
