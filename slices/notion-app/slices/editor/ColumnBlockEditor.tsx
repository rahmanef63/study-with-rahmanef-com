"use client";

import { Fragment, useRef } from "react";
import type { Block } from "@notion/shared/types";
import { uid } from "@notion/shared/lib/uid";
import { ColumnPane, ColumnDivider } from "./column/panes";

/** Root column-layout block (columns2 / columns3 / columns4 / columns5) — pure
 *  callback API. `depth` is the depth assigned to inner NestedBlocks (top-level
 *  = 1; nested = parent depth + 1). NestedBlock enforces the MAX-NEST cap.
 *  ColumnPane + ColumnDivider live in ./column/panes (200-LOC split). */
export function ColumnBlockEditor({
  block, onUpdate, depth = 1, pageId,
}: {
  block: Block;
  onUpdate: (patch: Partial<Block>) => void;
  depth?: number;
  pageId?: string;
}) {
  const n =
    block.type === "columns5" ? 5 :
    block.type === "columns4" ? 4 :
    block.type === "columns3" ? 3 : 2;
  const containerRef = useRef<HTMLDivElement | null>(null);

  const emptyBlock = (): Block => ({ id: uid(), type: "paragraph", text: "" });

  const columns: Block[][] = block.columns?.length === n
    ? block.columns
    : Array.from({ length: n }, () => [emptyBlock()]);

  const widths: number[] = block.colWidths?.length === n
    ? block.colWidths
    : Array.from({ length: n }, () => 100 / n);

  const handleColumnsChange = (colIndex: number, newBlocks: Block[]) => {
    const next = [...columns];
    next[colIndex] = newBlocks;
    onUpdate({ columns: next });
  };

  const commitWidths = (next: number[]) => onUpdate({ colWidths: next });

  return (
    <div ref={containerRef} className="group/cols my-1 flex w-full gap-0">
      {Array.from({ length: n }, (_, i) => (
        <Fragment key={`pane-frag-${i}`}>
          {i > 0 && (
            <ColumnDivider
              leftIdx={i - 1}
              widths={widths}
              getContainer={() => containerRef.current}
              onCommit={commitWidths}
            />
          )}
          <ColumnPane
            colIndex={i}
            blocks={columns[i] ?? [emptyBlock()]}
            columnBlockId={block.id}
            widthPct={widths[i]}
            depth={depth}
            pageId={pageId}
            onColumnsChange={handleColumnsChange}
          />
        </Fragment>
      ))}
    </div>
  );
}
