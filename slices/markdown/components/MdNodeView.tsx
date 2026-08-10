/** Read-only renderer for parsed markdown nodes. `renderNodes` groups
 *  consecutive list items into semantic <ul>/<ol> runs; everything else
 *  dispatches through MdNodeView. Inline formatting via the vendored
 *  `renderInline`. */

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MdNode, Align } from "../lib/parse";
import { renderInline } from "../lib/inline";
import { MathSpan } from "../lib/katex-lazy";
import { MermaidBlock } from "./MermaidBlock";
import { ChartBlock } from "./ChartBlock";

const CALLOUT_STYLE: Record<string, string> = {
  note: "border-sky-500/40 bg-sky-500/5",
  tip: "border-emerald-500/40 bg-emerald-500/5",
  warning: "border-amber-500/40 bg-amber-500/5",
  important: "border-violet-500/40 bg-violet-500/5",
  caution: "border-rose-500/40 bg-rose-500/5",
  default: "border-border bg-muted/40",
};

const ALIGN_CLASS: Record<Align, string> = { left: "text-left", center: "text-center", right: "text-right" };

const isListItem = (n: MdNode) => n.type === "bullet" || n.type === "numbered" || n.type === "todo";

/** Render a node list, grouping adjacent list items into <ul>/<ol>. */
export function renderNodes(nodes: MdNode[]): React.ReactNode {
  const out: React.ReactNode[] = [];
  let i = 0;
  while (i < nodes.length) {
    const n = nodes[i]!;
    if (isListItem(n)) {
      const run: MdNode[] = [];
      const ordered = n.type === "numbered";
      while (i < nodes.length && isListItem(nodes[i]!) && (nodes[i]!.type === "numbered") === ordered) {
        run.push(nodes[i++]!);
      }
      const Tag = ordered ? "ol" : "ul";
      out.push(
        <Tag key={`l${i}`} className={cn("my-2 space-y-1", ordered ? "list-decimal" : "list-none", "pl-5")}>
          {run.map((item, k) => <MdListItem key={k} node={item as ListNode} />)}
        </Tag>,
      );
      continue;
    }
    out.push(<MdNodeView key={i} node={n} />);
    i++;
  }
  return out;
}

type ListNode = Extract<MdNode, { type: "bullet" | "numbered" | "todo" }>;

function MdListItem({ node }: { node: ListNode }) {
  const ml = node.indent ? { marginLeft: `${node.indent * 1.25}rem` } : undefined;
  if (node.type === "todo") {
    return (
      <li style={ml} className="flex items-start gap-2 text-sm leading-relaxed">
        <span className={cn("mt-0.5 grid size-4 shrink-0 place-items-center rounded border", node.checked ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40")}>
          {node.checked && <Check className="size-3" />}
        </span>
        <span className={cn(node.checked && "text-muted-foreground line-through")}>{renderInline(node.text)}</span>
      </li>
    );
  }
  return <li style={ml} className="text-sm leading-relaxed">{renderInline(node.text)}</li>;
}

export function MdNodeView({ node }: { node: MdNode }): React.ReactNode {
  switch (node.type) {
    case "heading": {
      const Tag = `h${node.level}` as keyof React.JSX.IntrinsicElements;
      const size = ["text-3xl", "text-2xl", "text-xl", "text-lg", "text-base", "text-sm"][node.level - 1];
      return <Tag className={cn("mt-6 mb-2 font-semibold tracking-tight first:mt-0", size)}>{renderInline(node.text)}</Tag>;
    }
    case "paragraph":
      return <p className="my-2 text-sm leading-relaxed">{renderInline(node.text)}</p>;
    case "quote":
      return <blockquote className="my-3 border-l-2 border-border pl-4 text-sm italic text-muted-foreground">{renderInline(node.text)}</blockquote>;
    case "callout":
      return (
        <div className={cn("my-3 rounded-md border-l-2 px-4 py-3 text-sm", CALLOUT_STYLE[node.kind] ?? CALLOUT_STYLE.default)}>
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">{node.kind}</span>
          {renderInline(node.text)}
        </div>
      );
    case "code":
      return (
        <pre className="my-3 overflow-x-auto rounded-md bg-muted/70 p-3 text-xs">
          <code className="font-mono">{node.text}</code>
        </pre>
      );
    case "diagram":
      return <MermaidBlock text={node.text} />;
    case "chart":
      return <ChartBlock text={node.text} />;
    case "equation":
      return <MathSpan tex={node.text} display />;
    case "divider":
      return <hr className="my-5 border-border" />;
    case "image":
      return (
        <figure className="my-4">
          {/* arbitrary user-authored markdown URL — next/image cannot allowlist unknown hosts */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={node.url} alt={node.caption ?? ""} className="mx-auto max-w-full rounded-md" />
          {node.caption && <figcaption className="mt-1 text-center text-xs text-muted-foreground">{node.caption}</figcaption>}
        </figure>
      );
    case "table":
      return <MdTable rows={node.rows} align={node.align} />;
    case "toggle":
      return (
        <details className="my-2 rounded-md border border-border px-3 py-2 text-sm">
          <summary className="cursor-pointer font-medium">{renderInline(node.text)}</summary>
          <div className="mt-2 pl-2">{renderNodes(node.children)}</div>
        </details>
      );
    default:
      return null;
  }
}

function MdTable({ rows, align }: { rows: string[][]; align: Align[] }) {
  if (!rows.length) return null;
  const [head, ...body] = rows;
  return (
    <div className="my-3 overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>{head!.map((c, i) => <th key={i} className={cn("border border-border px-3 py-1.5 font-semibold", ALIGN_CLASS[align[i] ?? "left"])}>{renderInline(c)}</th>)}</tr>
        </thead>
        <tbody>
          {body.map((r, ri) => (
            <tr key={ri}>{r.map((c, ci) => <td key={ci} className={cn("border border-border px-3 py-1.5", ALIGN_CLASS[align[ci] ?? "left"])}>{renderInline(c)}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
