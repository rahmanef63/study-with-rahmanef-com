import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MdNode } from "../lib/parse";
import { renderInline } from "../lib/inline";

export type MarkdownListNode = Extract<MdNode, { type: "bullet" | "numbered" | "todo" }>;
/** Nested lists are children of their owning li, never siblings styled with margins. */
export function renderMarkdownList(items: readonly MarkdownListNode[]): ReactNode {
  const read = (start: number): { element: ReactNode; next: number } => {
    const first = items[start];
    const ordered = first.type === "numbered";
    const indent = first.indent;
    const children: ReactNode[] = [];
    let index = start;
    while (index < items.length && items[index].indent === indent && (items[index].type === "numbered") === ordered) {
      const item = items[index++];
      const nested: ReactNode[] = [];
      while (index < items.length && items[index].indent > indent) { const result = read(index); nested.push(result.element); index = result.next; }
      children.push(<li key={index} className="break-words text-sm leading-relaxed">{item.type === "todo" ? <span className="inline-flex items-start gap-2"><span role="img" aria-label={item.checked ? "Selesai" : "Belum selesai"} className={cn("mt-0.5 grid size-4 shrink-0 place-items-center rounded border", item.checked ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40")}>{item.checked ? <Check aria-hidden="true" className="size-3" /> : null}</span><span className={cn(item.checked && "text-muted-foreground line-through")}>{renderInline(item.text)}</span></span> : renderInline(item.text)}{nested}</li>);
    }
    const element = ordered ? <ol key={start} start={first.type === "numbered" ? first.start : undefined} className="my-2 list-decimal space-y-1 pl-6">{children}</ol> : <ul key={start} className={cn("my-2 space-y-1 pl-6", first.type === "todo" ? "list-none" : "list-disc")}>{children}</ul>;
    return { element, next: index };
  };
  const output: ReactNode[] = [];
  let index = 0;
  while (index < items.length) { const result = read(index); output.push(result.element); index = result.next; }
  return output;
}
