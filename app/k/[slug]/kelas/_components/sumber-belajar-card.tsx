"use client";

// "Sumber belajar" card for the Silabus — ported from the OS Kelas app, where
// it opened the `resources` window. That board is retired (#33): a curated link
// is now posts(kind "sumber") on the Diskusi feed, so this is a plain route
// link to that feed pre-filtered to the category — one tap from the course page
// to every curated link/tool, without re-rendering the list here (DRY).
//
// `?kind=sumber`, NOT `#sumber`: the feed's category filter is component state,
// so there is no anchor on the page for a fragment to reach.
import Link from "next/link";
import { ChevronRight, Library } from "lucide-react";
import { communityHref } from "@/lib/community";

export function SumberBelajarCard({ slug }: { slug: string }) {
  return (
    <Link
      href={communityHref.diskusiKind(slug, "sumber")}
      className="group flex h-full w-full items-center gap-3 rounded-[var(--radius-win)] rounded-[var(--radius)] border border-border bg-card p-4 text-left transition-colors hover:border-primary/30 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="grid size-9 shrink-0 place-items-center bg-primary/10 text-primary">
        <Library className="size-4" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Sumber belajar
        </span>
        <span className="block text-sm text-foreground">
          Tautan, tool &amp; referensi pilihan komunitas
        </span>
      </span>
      <ChevronRight
        className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
        aria-hidden
      />
    </Link>
  );
}
