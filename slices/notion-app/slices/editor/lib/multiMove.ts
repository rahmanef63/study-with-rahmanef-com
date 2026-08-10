/** Top-level multi-block move helpers for the drag-end handler. Vendored
 *  (pure subset) from notion-page-clone `slices/block-selection/lib/multiMove.ts`
 *  — only the three functions `pageDragEnd` calls. The selection *store* is
 *  NOT ported; the seam reads the selected ids and passes them in. Types via
 *  `@notion/shared/types`. Pure / no React. */

import type { Block } from "@notion/shared/types";

export function topLevelIdsInOrder(blocks: Block[], ids: string[]): string[] {
  const s = new Set(ids);
  return blocks.filter((b) => s.has(b.id)).map((b) => b.id);
}

/** Insert the selected group at `overBlockId`'s position in the top-level
 *  list (after removing them from their current positions). Drop-on-sibling. */
export function placeTopLevelGroupAtBlock(
  blocks: Block[],
  ids: string[],
  overBlockId: string,
): Block[] {
  const set = new Set(ids);
  if (set.has(overBlockId)) return blocks; // dropped on self
  const moving = blocks.filter((b) => set.has(b.id));
  if (moving.length === 0) return blocks;
  const remaining = blocks.filter((b) => !set.has(b.id));
  const overIdx = remaining.findIndex((b) => b.id === overBlockId);
  if (overIdx < 0) return blocks;
  return [...remaining.slice(0, overIdx), ...moving, ...remaining.slice(overIdx)];
}

/** Append all selected top-level blocks to the END of a container (toggle's
 *  children, or one of a columns block's column panes). */
export function appendTopLevelGroupToContainer(
  blocks: Block[],
  ids: string[],
  containerId: string,
  kind: "toggle" | "column",
  columnIndex?: number,
): Block[] {
  if (ids.includes(containerId)) return blocks; // can't drop into self
  const set = new Set(ids);
  const moving = blocks.filter((b) => set.has(b.id));
  if (moving.length === 0) return blocks;
  const remaining = blocks.filter((b) => !set.has(b.id));
  return remaining.map((b) => {
    if (b.id !== containerId) return b;
    if (kind === "toggle") {
      return { ...b, children: [...(b.children ?? []), ...moving], collapsed: false };
    }
    const cols = b.columns ?? [];
    const ci = columnIndex ?? 0;
    const newCols = cols.map((c, i) => (i === ci ? [...c, ...moving] : c));
    return { ...b, columns: newCols };
  });
}
