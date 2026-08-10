import type { Block } from "@notion/shared/types";
import type { EditorDataAdapter } from "./dataAdapter";

/**
 * Bulk-insert helper for markdown paste (M2c). The source app had a
 * server-side `insertBlocksAfter` mutation on its store; the rr seam only
 * exposes per-block CRUD, so this synthesizes the same contract from
 * `EditorDataAdapter` — sequential awaits keep ordering deterministic.
 * Hosts with a real bulk mutation can ignore this and the editor still
 * behaves identically.
 */
export async function insertBlocksAfter(
  data: EditorDataAdapter,
  args: {
    pageId: string;
    anchorBlockId: string;
    blocks: Block[];
    replaceAnchor?: boolean;
  },
): Promise<void> {
  const { pageId, anchorBlockId, blocks, replaceAnchor } = args;
  if (blocks.length === 0) return;

  const page = data.getPage(pageId);
  const anchorIndex =
    page?.blocks.findIndex((b) => b.id === anchorBlockId) ?? -1;
  // Anchor missing (host wired no data, or stale id) → append at end.
  const baseIndex = anchorIndex >= 0 ? anchorIndex : (page?.blocks.length ?? 1) - 1;

  let rest = blocks;
  if (replaceAnchor && anchorIndex >= 0) {
    await data.replaceBlock(pageId, anchorBlockId, blocks[0]);
    rest = blocks.slice(1);
  }
  for (let i = 0; i < rest.length; i++) {
    const b = rest[i];
    await data.addBlock(pageId, baseIndex + i, b.type, b);
  }
}
