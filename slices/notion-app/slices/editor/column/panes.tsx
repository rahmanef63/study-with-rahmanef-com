"use client";

import { useMemo, useRef } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import type { Block, BlockType } from "@notion/shared/types";
import { cn } from "@/lib/utils";
import { uid } from "@notion/shared/lib/uid";
import { Button } from "@/components/ui/button";
import { requireNested } from "@notion/slices/editor/blocks/nestedRegistry";
import { computeOrdinals } from "@notion/slices/editor/lib/listOrdinals";

export const MIN_COL = 10;

/** One column pane. */
export function ColumnPane({
  colIndex, blocks, columnBlockId, widthPct, depth, pageId, onColumnsChange,
}: {
  colIndex: number;
  blocks: Block[];
  columnBlockId: string;
  widthPct: number;
  depth: number;
  pageId?: string;
  onColumnsChange: (colIndex: number, newBlocks: Block[]) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `col:${columnBlockId}:${colIndex}` });
  const ordinals = useMemo(() => computeOrdinals(blocks), [blocks]);
  const refs = useRef<Map<string, HTMLElement | null>>(new Map());
  const registerRef = (id: string, el: HTMLElement | null) => refs.current.set(id, el);
  const focusBlock = (idx: number) => {
    const b = blocks[idx];
    if (b) refs.current.get(b.id)?.focus();
  };

  const onUpdate = (id: string, patch: Partial<Block>) => {
    onColumnsChange(colIndex, blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  };

  const onAdd = (afterIndex: number, type: BlockType = "paragraph") => {
    const newBlock: Block = { id: uid(), type, text: "", checked: type === "todo" ? false : undefined };
    const next = [...blocks];
    next.splice(afterIndex + 1, 0, newBlock);
    onColumnsChange(colIndex, next);
    setTimeout(() => refs.current.get(newBlock.id)?.focus(), 0);
  };

  const onDelete = (id: string) => {
    const next = blocks.filter((b) => b.id !== id);
    onColumnsChange(colIndex, next.length ? next : [{ id: uid(), type: "paragraph", text: "" }]);
  };

  // Empty-pane click → focus the last block (or add one) so clicks in the
  // gutters don't feel swallowed by the container.
  const onPaneClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget && !(e.target as HTMLElement).hasAttribute("data-col-pane-body")) return;
    const last = blocks[blocks.length - 1];
    if (last) refs.current.get(last.id)?.focus();
    else onAdd(-1);
  };

  return (
    <div
      ref={setNodeRef}
      data-col-pane
      style={{ flex: `0 0 ${widthPct}%` }}
      onClick={onPaneClick}
      className={cn(
        "group/col min-w-0 cursor-text rounded px-3 transition-colors first:pl-0 last:pr-0",
        isOver && "bg-brand/15 ring-2 ring-inset ring-brand",
      )}
    >
      <div data-col-pane-body className="min-h-10 space-y-0.5">
        <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
          {blocks.map((b, i) => {
            const NestedBlock = requireNested();
            return (
              <NestedBlock
                key={b.id}
                block={b}
                depth={depth}
                pageId={pageId}
                ordinal={ordinals.get(b.id)}
                onUpdate={(patch: Partial<Block>) => onUpdate(b.id, patch)}
                onAddAfter={(type: BlockType) => onAdd(i, type)}
                onDelete={() => onDelete(b.id)}
                onFocusNext={() => focusBlock(i + 1)}
                onFocusPrev={() => focusBlock(i - 1)}
                registerRef={registerRef}
              />
            );
          })}
        </SortableContext>
      </div>
      <Button
        variant="ghost"
        onClick={() => onAdd(blocks.length - 1)}
        className="mt-1 h-auto gap-1 p-0 text-xs font-normal text-muted-foreground/60 opacity-0 transition hover:bg-transparent hover:text-muted-foreground group-hover/col:opacity-100 [&_svg]:size-3"
      >
        <Plus className="h-3 w-3" /> Add block
      </Button>
    </div>
  );
}

/** Divider between two panes — drag to redistribute the adjacent widths. */
export function ColumnDivider({
  leftIdx, getContainer, widths, onCommit,
}: {
  leftIdx: number;
  getContainer: () => HTMLElement | null;
  widths: number[];
  onCommit: (next: number[]) => void;
}) {
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const c = getContainer();
    if (!c) return;
    const rect = c.getBoundingClientRect();
    const startX = e.clientX;
    const startLeft = widths[leftIdx];
    const startRight = widths[leftIdx + 1];
    const combined = startLeft + startRight;

    const next = [...widths];
    const onMove = (ev: PointerEvent) => {
      const deltaPct = ((ev.clientX - startX) / rect.width) * 100;
      let l = startLeft + deltaPct;
      l = Math.max(MIN_COL, Math.min(combined - MIN_COL, l));
      next[leftIdx] = l;
      next[leftIdx + 1] = combined - l;
      const panes = c.querySelectorAll<HTMLElement>("[data-col-pane]");
      panes.forEach((p, i) => { if (next[i] != null) p.style.flex = `0 0 ${next[i]}%`; });
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      onCommit(next.map((nn) => Math.round(nn * 100) / 100));
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  return (
    <div
      onPointerDown={onPointerDown}
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize columns"
      className="group/divider relative w-2 shrink-0 cursor-ew-resize"
    >
      <div className="absolute inset-y-1 left-1/2 w-px -translate-x-1/2 rounded-full bg-transparent transition-colors group-hover/cols:bg-border group-hover/divider:!bg-brand group-active/divider:!bg-brand" />
      <div className="absolute inset-y-1 left-1/2 w-1 -translate-x-1/2 rounded-full bg-brand/40 opacity-0 transition-opacity group-hover/divider:opacity-100" />
    </div>
  );
}
