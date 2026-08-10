"use client";

/** Review tab — the rendered document with block-anchored comments. Hovering
 *  a top-level node reveals an "add comment" affordance; comments render
 *  inline under their anchor. A document-level composer sits at the bottom.
 *  Fully controlled via props (see MarkdownPage fallback for standalone). */

import * as React from "react";
import { MessageSquarePlus, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { MdNode } from "../lib/parse";
import type { MdComment } from "../lib/comments";
import { commentsFor } from "../lib/comments";
import { renderNodes } from "./MdNodeView";

interface Props {
  nodes: MdNode[];
  comments: MdComment[];
  onAdd: (anchor: number | null, text: string) => void;
  onResolve?: (id: string) => void;
}

export function ReviewTab({ nodes, comments, onAdd, onResolve }: Props) {
  const [composing, setComposing] = React.useState<number | null>(null);
  return (
    <div className="flex flex-col gap-1">
      {nodes.map((node, i) => (
        <ReviewNode
          key={i}
          node={node}
          anchored={commentsFor(comments, i)}
          composing={composing === i}
          onCompose={() => setComposing(composing === i ? null : i)}
          onSubmit={(text) => { onAdd(i, text); setComposing(null); }}
          onResolve={onResolve}
        />
      ))}
      <div className="mt-4 border-t border-border pt-3">
        <p className="mb-2 text-xs font-medium text-muted-foreground">Document comments</p>
        <CommentList items={commentsFor(comments, null)} onResolve={onResolve} />
        <Composer onSubmit={(text) => onAdd(null, text)} placeholder="Comment on the whole document…" />
      </div>
    </div>
  );
}

function ReviewNode({ node, anchored, composing, onCompose, onSubmit, onResolve }: {
  node: MdNode;
  anchored: MdComment[];
  composing: boolean;
  onCompose: () => void;
  onSubmit: (text: string) => void;
  onResolve?: (id: string) => void;
}) {
  const open = anchored.filter((c) => !c.resolved).length;
  return (
    <div className={cn("group relative rounded-md pr-8", (open > 0 || composing) && "bg-amber-500/5")}>
      {/* list items render standalone here; ordinal grouping matters less in review */}
      {renderNodes([node])}
      <Button
        variant="ghost" size="sm" type="button"
        onClick={onCompose}
        aria-label="Add comment"
        className={cn(
          "absolute right-0 top-1 h-6 w-6 p-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100",
          (open > 0 || composing) && "opacity-100 text-amber-600",
        )}
      >
        <MessageSquarePlus className="size-3.5" />
      </Button>
      {(anchored.length > 0 || composing) && (
        <div className="mb-2 ml-4 border-l-2 border-amber-500/40 pl-3">
          <CommentList items={anchored} onResolve={onResolve} />
          {composing && <Composer autoFocus onSubmit={onSubmit} placeholder="Add a comment…" />}
        </div>
      )}
    </div>
  );
}

function CommentList({ items, onResolve }: { items: MdComment[]; onResolve?: (id: string) => void }) {
  if (!items.length) return null;
  return (
    <ul className="mb-2 space-y-1.5">
      {items.map((c) => (
        <li key={c.id} className={cn("flex items-start justify-between gap-2 rounded-md bg-muted/40 px-2.5 py-1.5 text-xs", c.resolved && "opacity-50")}>
          <div>
            {c.author && <span className="mr-1.5 font-semibold">{c.author}</span>}
            <span className={cn(c.resolved && "line-through")}>{c.text}</span>
          </div>
          {onResolve && !c.resolved && (
            <Button variant="ghost" size="sm" type="button" onClick={() => onResolve(c.id)} aria-label="Resolve" className="h-5 w-5 shrink-0 p-0 text-muted-foreground">
              <Check className="size-3" />
            </Button>
          )}
        </li>
      ))}
    </ul>
  );
}

function Composer({ onSubmit, placeholder, autoFocus }: { onSubmit: (text: string) => void; placeholder: string; autoFocus?: boolean }) {
  const [text, setText] = React.useState("");
  const submit = () => {
    const t = text.trim();
    if (!t) return;
    onSubmit(t);
    setText("");
  };
  return (
    <div className="flex items-end gap-2">
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); submit(); } }}
        placeholder={placeholder}
        autoFocus={autoFocus}
        rows={2}
        className="min-h-0 flex-1 text-xs"
      />
      <Button size="sm" type="button" onClick={submit} disabled={!text.trim()} className="h-8 text-xs">
        Comment
      </Button>
    </div>
  );
}
