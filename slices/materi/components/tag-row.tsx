// materi slice — the tag row under a materi body. LINKS, not filter chips:
// from a materi page a tag means "show me the rest of these", which is the
// library opened on that tag, a real URL you can share and go back from.
//
// Server-renderable (no "use client"): it is anchors and text. The detail view
// that mounts it is a client island only because the BODY is member-gated.
import Link from "next/link";
import { Tag } from "lucide-react";
import { mergeMateriCopy, type MateriCopyOverride } from "../config/copy";

export type TagRowProps = {
  tags: string[];
  /** Built by the caller — a function prop cannot cross the server→client
   *  boundary, so the href builder always lives on the same side as this. */
  tagHref: (tag: string) => string;
  copy?: MateriCopyOverride;
  className?: string;
};

export function TagRow({ tags, tagHref, copy: copyOverride, className }: TagRowProps) {
  const copy = mergeMateriCopy(copyOverride);
  if (tags.length === 0) return null;
  return (
    <div
      className={"flex flex-wrap items-center gap-2" + (className ? ` ${className}` : "")}
      aria-label={copy.tagsLabel}
    >
      <Tag className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
      {tags.map((tag) => (
        <Link
          key={tag}
          href={tagHref(tag)}
          // Hard 2px frame + offset shadow, radius 0 — the cabinet language.
          // Body face, not font-display: Press Start 2P truncates at this size.
          className="border-2 border-border px-2 py-0.5 text-xs text-muted-foreground shadow-[2px_2px_0_0_var(--pixel-shadow)] transition-colors hover:border-primary hover:text-primary"
        >
          {tag}
        </Link>
      ))}
    </div>
  );
}
