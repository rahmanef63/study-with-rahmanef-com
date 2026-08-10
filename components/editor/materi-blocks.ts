// Pure block-list transforms backing the editor's data adapter.
//
// Every one is (blocks, args) → new blocks, top-level only: the editor's own
// container blocks (toggle children, column panes) call these through the same
// adapter with the CONTAINER's id, and the recursive tree walk for those lives
// in the slice (`@notion/…/lib/blockTree`). Here we only need the flat page
// list, because that is the shape `contentBlocks` persists.
//
// Split out of the hook so the interesting logic is testable without React.

import { uid } from "@notion/shared/lib/uid";
import type { Block, BlockType } from "@notion/shared/types";

/**
 * Insert a fresh block after `afterIndex` (-1 = prepend).
 *
 * The id is a REQUIRED argument rather than minted here: the caller is a React
 * state updater, which StrictMode invokes twice, and a self-minting id would
 * hand back a block whose id the caller cannot predict — the editor needs it to
 * move the caret into the new block.
 */
export function addBlockAt(
  blocks: Block[],
  afterIndex: number,
  id: string,
  type: BlockType = "paragraph",
  init: Partial<Block> = {},
): Block[] {
  const block: Block = { type, text: "", ...init, id };
  const at = Math.min(Math.max(afterIndex + 1, 0), blocks.length);
  return [...blocks.slice(0, at), block, ...blocks.slice(at)];
}

export function patchBlock(blocks: Block[], blockId: string, patch: Partial<Block>): Block[] {
  return blocks.map((b) => (b.id === blockId ? { ...b, ...patch } : b));
}

/** Remove a block, but never leave the page with zero blocks — an empty list
 *  renders as a page with nothing to put the caret in. */
export function removeBlock(blocks: Block[], blockId: string): Block[] {
  const next = blocks.filter((b) => b.id !== blockId);
  return next.length > 0 ? next : [{ id: uid(), type: "paragraph", text: "" }];
}

/** Copy a block directly beneath itself with a fresh id (and fresh ids for any
 *  nested children/columns, so the duplicate is not id-aliased to the source). */
export function duplicateBlockAt(blocks: Block[], blockId: string, newId: string): Block[] {
  const index = blocks.findIndex((b) => b.id === blockId);
  if (index === -1) return blocks;
  const copy = { ...regenIds(blocks[index]!), id: newId };
  return [...blocks.slice(0, index + 1), copy, ...blocks.slice(index + 1)];
}

function regenIds(block: Block): Block {
  const next: Block = { ...block, id: uid() };
  if (block.children !== undefined) next.children = block.children.map(regenIds);
  if (block.columns !== undefined) next.columns = block.columns.map((col) => col.map(regenIds));
  return next;
}

/**
 * Reorder to exactly `orderedIds`. Ids the page does not have are ignored and
 * blocks the caller forgot are appended in their existing order — a drag that
 * races a concurrent edit then loses the ORDER, never the CONTENT.
 */
export function reorderBlocks(blocks: Block[], orderedIds: string[]): Block[] {
  const byId = new Map(blocks.map((b) => [b.id, b]));
  const out: Block[] = [];
  const taken = new Set<string>();
  for (const id of orderedIds) {
    const block = byId.get(id);
    if (block === undefined || taken.has(id)) continue;
    taken.add(id);
    out.push(block);
  }
  for (const block of blocks) if (!taken.has(block.id)) out.push(block);
  return out;
}

/** Turn-into. Clears the fields that belong to the OLD type, so a code block
 *  turned into a paragraph does not keep a stale `lang`, and a todo turned into
 *  a heading does not keep a checkbox. */
export function setBlockType(blocks: Block[], blockId: string, type: BlockType): Block[] {
  return blocks.map((b) =>
    b.id === blockId
      ? { ...b, type, checked: undefined, lang: type === "code" ? b.lang : undefined }
      : b,
  );
}

export function replaceBlock(blocks: Block[], blockId: string, next: Block): Block[] {
  return blocks.map((b) => (b.id === blockId ? next : b));
}
