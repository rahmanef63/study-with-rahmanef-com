import type { Block } from "@notion/shared/types";

/** 1-based ordinals for consecutive numbered blocks at the same indent.
 *  Reset deeper counters on every non-numbered or shallower-indent block.
 *  (Split out of PageEditor for the 200-line cap — logic verbatim.) */
export function ordinalsOf(blocks: Block[]): Map<string, number> {
  const ordinals = new Map<string, number>();
  const counters: number[] = [];
  for (const b of blocks) {
    const depth = b.indent ?? 0;
    if (b.type === "numbered") {
      counters[depth] = (counters[depth] ?? 0) + 1;
      counters.length = depth + 1;
      ordinals.set(b.id, counters[depth]);
    } else {
      counters.length = depth;
    }
  }
  return ordinals;
}
