"use client";
// search slice — one hit row. EVERY kind renders a real next/link (rr P1: never
// raw <a> for INTERNAL navigation) whose click is INTERCEPTED when the host
// passes onNavigate — the openApp seam (#23): the slice stays portable and
// never imports the shell. The external-anchor branch the curated resource
// board needed is gone with it (v1.8 #33): a Diskusi post is an internal
// permalink, and its external link (if any) lives on the post page.
import { BookOpen, FileText, MessagesSquare } from "lucide-react";
import Link from "next/link";
import type { SearchHit } from "../types";
import type { SearchCopy } from "../config/copy";

/** Per-kind aria-label prefix — copy stays props-driven (rr P1). */
const LABEL_KEY: Record<SearchHit["kind"], (copy: SearchCopy) => string> = {
  course: (copy) => copy.openCourse,
  lesson: (copy) => copy.openLesson,
  post: (copy) => copy.openPost,
};

export type SearchResultItemProps = {
  hit: SearchHit;
  href: string;
  onNavigate?: (href: string) => void;
  copy: SearchCopy;
};

const ROW_CLASS =
  "flex items-start gap-3 rounded-md rounded-[var(--radius)] border border-border bg-card px-3 py-2.5 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function RowBody({ hit }: { hit: SearchHit }) {
  const Icon =
    hit.kind === "course" ? BookOpen : hit.kind === "post" ? MessagesSquare : FileText;
  return (
    <>
      <Icon aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium text-foreground">{hit.title}</span>
        {hit.kind === "lesson" && hit.snippet.length > 0 ? (
          <span className="mt-0.5 line-clamp-2 block text-xs text-muted-foreground">
            {hit.snippet}
          </span>
        ) : null}
      </span>
    </>
  );
}

export function SearchResultItem({ hit, href, onNavigate, copy }: SearchResultItemProps) {
  return (
    <li>
      <Link
        href={href}
        onClick={(e) => {
          if (onNavigate) {
            e.preventDefault();
            onNavigate(href);
          }
        }}
        aria-label={`${LABEL_KEY[hit.kind](copy)}: ${hit.title}`}
        className={ROW_CLASS}
      >
        <RowBody hit={hit} />
      </Link>
    </li>
  );
}
