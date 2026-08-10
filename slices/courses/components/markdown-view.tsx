// courses slice — lesson markdown read surface.
//
// Delegates to the rr `markdown` slice. The hand-rolled parser this replaces
// (lib/markdown.ts, 144 LOC) understood five block types — heading, paragraph,
// list, quote, code. The slice understands fifteen: those plus to-do, callout,
// divider, image, TABLE, toggle (<details>), equation, mermaid and chart. That
// is the difference between "notes with formatting" and a page you would
// actually publish a lesson on.
//
// The swap was designed for: this file's original header recorded that its
// `content` prop deliberately matched <MarkdownReader/>'s so the implementation
// could be exchanged without touching a consumer. Three call sites — the lesson
// view, the post body and the manage-lesson preview — all upgraded by this one
// file, none of them edited.
//
// SERVER-RENDERED, on purpose. <MarkdownReader/> itself is "use client", but
// `parseMarkdown` and `renderNodes` are pure and hook-free, so calling them
// directly keeps lesson prose in the server HTML — which is what crawlers and
// first paint get. Only the three heavy blocks are client islands, and the
// slice already `import()`s KaTeX, mermaid and recharts on first use, so a
// lesson without maths, diagrams or charts downloads none of them.
import { parseMarkdown, renderNodes } from "@/features/markdown";
import { cn } from "@/lib/utils";

export type MarkdownViewProps = {
  /** Raw markdown. */
  content: string;
  className?: string;
};

export function MarkdownView({ content, className }: MarkdownViewProps) {
  return (
    <div className={cn("space-y-4 leading-relaxed", className)}>
      {renderNodes(parseMarkdown(content))}
    </div>
  );
}
