// courses slice — lesson markdown read surface.
// Renders the typed AST from lib/markdown.ts as React elements (XSS-safe by
// construction — no dangerouslySetInnerHTML anywhere). Same `content` prop
// contract as the rr `markdown` slice's <MarkdownReader/> so the integrator
// can swap implementations post-v1 without touching consumers.
import Link from "next/link";
import { Fragment } from "react";
import { parseMarkdown } from "../lib/markdown";
import type { MdBlock, MdInline } from "../types";

function InlineRun({ inline }: { inline: MdInline[] }) {
  return (
    <>
      {inline.map((token, i) => {
        switch (token.kind) {
          case "bold":
            return <strong key={i}>{token.text}</strong>;
          case "italic":
            return <em key={i}>{token.text}</em>;
          case "code":
            return (
              <code key={i} className="rounded bg-muted px-1 py-0.5 font-mono text-sm">
                {token.text}
              </code>
            );
          case "link":
            return (
              <Link
                key={i}
                href={token.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary underline underline-offset-4"
              >
                {token.text}
              </Link>
            );
          default:
            return <Fragment key={i}>{token.text}</Fragment>;
        }
      })}
    </>
  );
}

function Block({ block }: { block: MdBlock }) {
  switch (block.kind) {
    case "heading": {
      const cls = "font-semibold tracking-tight text-foreground";
      if (block.level === 1) {
        return <h2 className={`${cls} mt-8 text-2xl first:mt-0`}><InlineRun inline={block.inline} /></h2>;
      }
      if (block.level === 2) {
        return <h3 className={`${cls} mt-6 text-xl first:mt-0`}><InlineRun inline={block.inline} /></h3>;
      }
      return <h4 className={`${cls} mt-4 text-lg first:mt-0`}><InlineRun inline={block.inline} /></h4>;
    }
    case "paragraph":
      return (
        <p className="leading-7 text-foreground/90">
          <InlineRun inline={block.inline} />
        </p>
      );
    case "quote":
      return (
        <blockquote className="border-l-2 border-border pl-4 italic text-muted-foreground">
          <InlineRun inline={block.inline} />
        </blockquote>
      );
    case "codeblock":
      return (
        <pre className="overflow-x-auto rounded-lg bg-muted p-4 font-mono text-sm">
          <code>{block.text}</code>
        </pre>
      );
    case "list": {
      const items = block.items.map((item, i) => (
        <li key={i}>
          <InlineRun inline={item} />
        </li>
      ));
      return block.ordered ? (
        <ol className="ml-6 list-decimal space-y-1 leading-7">{items}</ol>
      ) : (
        <ul className="ml-6 list-disc space-y-1 leading-7">{items}</ul>
      );
    }
    default:
      return null;
  }
}

export type MarkdownViewProps = {
  /** Markdown source (lesson contentMd). */
  content: string;
  className?: string;
};

/** Lesson material renderer — headings, lists, quotes, code, http(s) links. */
export function MarkdownView({ content, className }: MarkdownViewProps) {
  const blocks = parseMarkdown(content);
  return (
    <div className={className ? `space-y-4 ${className}` : "space-y-4"}>
      {blocks.map((block, i) => (
        <Block key={i} block={block} />
      ))}
    </div>
  );
}
