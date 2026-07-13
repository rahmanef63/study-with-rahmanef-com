"use client";
// search slice — one hit row. Renders a real next/link (rr P1: never raw <a>)
// whose click is INTERCEPTED when the host passes onNavigate — that is the
// os-shell openApp seam (#23): the slice stays portable, never imports the shell.
import { BookOpen, FileText } from "lucide-react";
import Link from "next/link";
import type { SearchHit } from "../types";
import type { SearchCopy } from "../config/copy";

export type SearchResultItemProps = {
  hit: SearchHit;
  href: string;
  onNavigate?: (href: string) => void;
  copy: SearchCopy;
};

export function SearchResultItem({ hit, href, onNavigate, copy }: SearchResultItemProps) {
  const Icon = hit.kind === "course" ? BookOpen : FileText;
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
        className="flex items-start gap-3 rounded-md border border-border bg-card px-3 py-2.5 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Icon aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium text-foreground">
            {hit.title}
          </span>
          {hit.kind === "lesson" && hit.snippet.length > 0 ? (
            <span className="mt-0.5 line-clamp-2 block text-xs text-muted-foreground">
              {hit.snippet}
            </span>
          ) : null}
        </span>
      </Link>
    </li>
  );
}
