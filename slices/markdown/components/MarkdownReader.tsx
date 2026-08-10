/** MarkdownReader — read-only page container for markdown rich text.
 *
 *  The sibling read surface to the notion block editor: feed it a markdown
 *  string (e.g. produced by `blocksToMarkdown(notionBlocks)`) and it renders
 *  the same content as a clean document. Pure presentational — no editing, no
 *  store, no Convex. Pass `content` (markdown) or pre-parsed `nodes`. */

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { parseMarkdown, type MdNode } from "../lib/parse";
import { renderNodes } from "./MdNodeView";

const MAXW = {
  prose: "max-w-prose",
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
  none: "max-w-none",
} as const;

export interface MarkdownReaderProps {
  /** Markdown source. Ignored when `nodes` is provided. */
  content?: string;
  /** Pre-parsed nodes (skip parsing — e.g. shared parse result). */
  nodes?: MdNode[];
  /** Page title rendered above the body. */
  title?: string;
  /** Emoji or icon node shown before the title. */
  icon?: React.ReactNode;
  /** Content column width. Default `3xl`. */
  maxWidth?: keyof typeof MAXW;
  className?: string;
}

export function MarkdownReader({
  content = "",
  nodes,
  title,
  icon,
  maxWidth = "3xl",
  className,
}: MarkdownReaderProps) {
  const parsed = React.useMemo(() => nodes ?? parseMarkdown(content), [nodes, content]);
  return (
    <article className={cn("mx-auto w-full px-4 py-6", MAXW[maxWidth], className)}>
      {title && (
        <header className="mb-4 flex items-center gap-2">
          {icon && <span className="text-2xl leading-none">{icon}</span>}
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        </header>
      )}
      <div className="text-foreground">{renderNodes(parsed)}</div>
    </article>
  );
}
