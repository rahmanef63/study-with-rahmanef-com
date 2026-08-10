"use client";

import { useMemo } from "react";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { Block, BlockType } from "@notion/shared/types";
import { uid } from "@notion/shared/lib/uid";
import { requireNested } from "@notion/slices/editor/blocks/nestedRegistry";
import { computeOrdinals } from "@notion/slices/editor/lib/listOrdinals";
import { focusBlockSoon, findBlockNode } from "@notion/slices/editor/lib/focusBlock";

/** Renders a synced block's nested children. When `editable=false`, mutations
 *  from NestedBlock are no-ops (ref mode reading a source it can't own). */
export function SyncedChildrenList({
  children, setChildren, pageId, editable,
}: {
  children: Block[];
  setChildren: (next: Block[]) => void;
  pageId?: string;
  editable: boolean;
}) {
  const NestedBlock = requireNested();
  const ordinals = useMemo(() => computeOrdinals(children), [children]);
  return (
    <SortableContext items={children.map((c) => c.id)} strategy={verticalListSortingStrategy}>
      <div className="space-y-0.5">
        {children.map((child, ci) => (
          <NestedBlock
            key={child.id}
            block={child}
            depth={1}
            pageId={pageId}
            ordinal={ordinals.get(child.id)}
            onUpdate={(patch: Partial<Block>) => {
              if (!editable) return;
              setChildren(children.map((c, j) => (j === ci ? { ...c, ...patch } : c)));
            }}
            onDelete={() => {
              if (!editable) return;
              setChildren(children.filter((_, j) => j !== ci));
            }}
            onAddAfter={(type: BlockType) => {
              if (!editable) return;
              const nb: Block = { id: uid(), type: type ?? "paragraph", text: "" };
              const nc = [...children];
              nc.splice(ci + 1, 0, nb);
              setChildren(nc);
              focusBlockSoon(nb.id);
            }}
            onFocusNext={() => {
              const next = children[ci + 1];
              if (next) findBlockNode(next.id)?.focus();
            }}
            onFocusPrev={() => {
              const prev = children[ci - 1];
              if (prev) findBlockNode(prev.id)?.focus();
            }}
          />
        ))}
      </div>
    </SortableContext>
  );
}
