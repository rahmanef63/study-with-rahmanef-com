"use client";
// posts slice — post body renderer.
//
// The markdown renderer is NOT re-implemented here: MarkdownView from
// @/features/courses is the app's one safe-subset renderer (typed AST → React
// elements, no dangerouslySetInnerHTML, only http(s) links linkify). Barrel
// import, per the cross-slice rule.
//
// `excerpt` swaps to the plain-text collapse used on feed cards — a card must
// not render headings, code blocks and lists inside a 3-line clamp.
import { MarkdownView } from "@/features/courses";
import { cn } from "@/lib/utils";
import { toExcerpt } from "../lib/excerpt";

export type PostBodyProps = {
  bodyMd: string;
  /** Feed card: collapse to N chars of plain text instead of rendering markdown. */
  excerpt?: boolean;
  /** Excerpt length override (chars). */
  excerptChars?: number;
  className?: string;
};

export function PostBody({ bodyMd, excerpt = false, excerptChars, className }: PostBodyProps) {
  if (excerpt) {
    return (
      <p className={cn("line-clamp-3 text-sm text-muted-foreground", className)}>
        {toExcerpt(bodyMd, excerptChars)}
      </p>
    );
  }
  return <MarkdownView content={bodyMd} className={className} />;
}
