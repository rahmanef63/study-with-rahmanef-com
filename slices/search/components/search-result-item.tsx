"use client";
// search slice — one hit row. Course/lesson render a real next/link (rr P1:
// never raw <a> for INTERNAL navigation) whose click is INTERCEPTED when the
// host passes onNavigate — the os-shell openApp seam (#23): the slice stays
// portable, never imports the shell. Resource hits (#29) are EXTERNAL urls:
// a plain anchor with target="_blank" rel="noopener noreferrer", deliberately
// BYPASSING onNavigate (next/link is internal-routing only; noopener is the
// safety requirement here).
import { BookOpen, ExternalLink, FileText } from "lucide-react";
import Link from "next/link";
import type { SearchHit } from "../types";
import type { SearchCopy } from "../config/copy";

export type SearchResultItemProps = {
  hit: SearchHit;
  href: string;
  onNavigate?: (href: string) => void;
  copy: SearchCopy;
};

const ROW_CLASS =
  "flex items-start gap-3 rounded-md border border-border bg-card px-3 py-2.5 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function RowBody({ hit }: { hit: SearchHit }) {
  const Icon =
    hit.kind === "course" ? BookOpen : hit.kind === "resource" ? ExternalLink : FileText;
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
  if (hit.kind === "resource") {
    // External destination — new tab, no opener handle, NEVER onNavigate (#29).
    return (
      <li>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${copy.openResource}: ${hit.title}`}
          className={ROW_CLASS}
        >
          <RowBody hit={hit} />
        </a>
      </li>
    );
  }

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
        aria-label={`${hit.kind === "course" ? copy.openCourse : copy.openLesson}: ${hit.title}`}
        className={ROW_CLASS}
      >
        <RowBody hit={hit} />
      </Link>
    </li>
  );
}
