"use client";

import { useState } from "react";
import { RefreshCw, Plus, Link2, AlertTriangle, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Block } from "@notion/shared/types";
import { uid } from "@notion/shared/lib/uid";
import { focusBlockSoon } from "@notion/slices/editor/lib/focusBlock";
import { bgColorClass } from "@notion/slices/editor/lib/colors";
import { useEditorData, useEditorAdapter } from "@notion/slices/editor/lib/adapterContext";
import { SyncedChildrenList } from "./ChildrenList";

/** Source mode — owns children, editable, copy-link affordance. */
export function SyncedSourceView({
  block, pageId, onUpdate,
}: {
  block: Block;
  pageId?: string;
  onUpdate: (patch: Partial<Block>) => void;
}) {
  const children: Block[] = block.children ?? [];
  const setChildren = (next: Block[]) => onUpdate({ children: next });
  const [copied, setCopied] = useState(false);
  const [pasting, setPasting] = useState(false);
  const [pasteValue, setPasteValue] = useState("");

  const convertToRef = () => {
    const m = pasteValue.trim().match(/^(?:nosion:\/\/sync\/)?([a-z0-9]{6,})$/i);
    if (!m) return;
    const targetSyncId = m[1];
    if (targetSyncId === block.syncId) { setPasteValue(""); return; }
    onUpdate({ syncId: targetSyncId, syncRef: true, children: undefined });
    setPasting(false);
    setPasteValue("");
  };

  const addChild = () => {
    const nb: Block = { id: uid(), type: "paragraph", text: "" };
    setChildren([...children, nb]);
    focusBlockSoon(nb.id);
  };

  const copyLink = async () => {
    if (!block.syncId) return;
    try {
      await navigator.clipboard.writeText(`nosion://sync/${block.syncId}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API unavailable — fall through silently.
    }
  };

  return (
    <div className={cn("rounded-md border border-brand/30 bg-brand/5 p-2", bgColorClass(block.bgColor))}>
      <div className="mb-1.5 flex items-center gap-2 border-b border-brand/20 px-1 pb-1.5 text-[10px] font-medium uppercase tracking-wider text-brand/80">
        <RefreshCw className="h-3 w-3" />
        <span>Synced — original</span>
        <span className="ml-auto inline-flex items-center gap-2">
          <code className="rounded bg-card/60 px-1 py-0.5 font-mono text-[9px] normal-case tracking-normal">{block.syncId?.slice(0, 8)}</code>
          <Button
            variant="ghost" onClick={copyLink}
            title="Copy sync link — paste anywhere as a synced reference"
            className="inline-flex h-auto items-center gap-1 rounded px-1 py-0.5 text-[10px] font-medium normal-case tracking-wider hover:bg-card/60 [&_svg]:size-3"
          >
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            {copied ? "Copied" : "Copy link"}
          </Button>
        </span>
      </div>
      <SyncedChildrenList children={children} setChildren={setChildren} pageId={pageId} editable />
      <div className="mt-1 flex items-center gap-3">
        <Button
          variant="ghost" onClick={addChild}
          className="h-auto gap-1 p-0 text-xs font-normal text-muted-foreground/60 hover:bg-transparent hover:text-muted-foreground [&_svg]:size-3"
        >
          <Plus className="h-3 w-3" /> Add inside synced block
        </Button>
        {children.length === 0 && !pasting && (
          <Button
            variant="ghost" onClick={() => setPasting(true)}
            className="h-auto p-0 text-xs font-normal text-muted-foreground/60 hover:bg-transparent hover:text-muted-foreground"
          >
            …or paste a sync link to mirror existing content
          </Button>
        )}
        {pasting && (
          <form onSubmit={(e) => { e.preventDefault(); convertToRef(); }} className="flex items-center gap-1">
            <Input
              autoFocus value={pasteValue} onChange={(e) => setPasteValue(e.target.value)}
              placeholder="nosion://sync/<id>" className="h-auto px-2 py-0.5 text-xs"
            />
            <Button type="submit" className="h-auto px-2 py-0.5 text-xs">Mirror</Button>
            <Button
              variant="ghost" type="button"
              onClick={() => { setPasting(false); setPasteValue(""); }}
              className="h-auto p-0 text-xs font-normal text-muted-foreground hover:bg-transparent hover:text-foreground"
            >
              Cancel
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}

/** Ref mode — editable mirror of a source block's children, anywhere. */
export function SyncedRefView({
  block, sourcePage, sourceBlock, cycle,
}: {
  block: Block;
  sourcePage: { id: string; title: string } | null;
  sourceBlock: Block | null;
  cycle?: boolean;
}) {
  const { updateBlock } = useEditorData();
  const { page } = useEditorAdapter();

  if (!sourceBlock || !sourcePage) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-warning/40 bg-warning/5 p-3 text-xs text-warning">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <div>
          <div className="font-medium">Synced source not found.</div>
          <div className="mt-0.5 text-[10px] opacity-80">
            sync id <code className="font-mono">{block.syncId?.slice(0, 8) ?? "—"}</code> — the original may have been deleted or moved to a workspace you can&rsquo;t see.
          </div>
        </div>
      </div>
    );
  }

  if (cycle) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-xs text-destructive">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <div>
          <div className="font-medium">Synced cycle detected.</div>
          <div className="mt-0.5 text-[10px] opacity-80">
            sync id <code className="font-mono">{block.syncId?.slice(0, 8)}</code> — the source on <span className="font-medium">{sourcePage.title || "Untitled"}</span> references back to this group.
          </div>
        </div>
      </div>
    );
  }

  const children: Block[] = sourceBlock.children ?? [];
  const setChildren = (next: Block[]) => { updateBlock(sourcePage.id, sourceBlock.id, { children: next }); };

  return (
    <div className={cn("rounded-md border border-brand/30 bg-brand/5 p-2", bgColorClass(block.bgColor))}>
      <div className="mb-1.5 flex items-center gap-2 border-b border-brand/20 px-1 pb-1.5 text-[10px] font-medium uppercase tracking-wider text-brand/80">
        <RefreshCw className="h-3 w-3" />
        <span>Synced from</span>
        <Button
          variant="ghost" onClick={() => page?.navigateToPage?.(sourcePage.id)}
          className="inline-flex h-auto items-center gap-1 p-0 font-normal normal-case text-brand hover:bg-transparent hover:underline [&_svg]:size-3"
        >
          <Link2 className="h-3 w-3" />
          {sourcePage.title || "Untitled"}
        </Button>
        <span className="ml-auto text-[9px] normal-case opacity-70">edits propagate to all refs</span>
      </div>
      <SyncedChildrenList children={children} setChildren={setChildren} pageId={sourcePage.id} editable />
    </div>
  );
}
