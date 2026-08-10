import type { ComponentType } from "react";
import type { BlockType, BlockRendererProps } from "@notion/shared/types";
import { ImageBlock } from "./ImageBlock";
import { EmbedBlock } from "./EmbedBlock";
import { ButtonBlock } from "./ButtonBlock";
import { AudioBlock } from "./AudioBlock";
import { VideoBlock } from "./VideoBlock";

export type { BlockRendererProps };

function DividerAdapter() {
  return <hr className="border-border my-2" />;
}

/**
 * Built-in renderers for the "special" (non-text) block types.
 * `equation`, `table`, `toc` are intentionally omitted in this milestone —
 * they depend on host-supplied capabilities (katex editor / table grid / page
 * context) and are wired via the editor's component-registry seam later.
 * `getBlockRenderer` → undefined means the caller falls back to text.
 */
export const BLOCK_RENDERERS: Partial<Record<BlockType, ComponentType<BlockRendererProps>>> = {
  image: ImageBlock,
  embed: EmbedBlock,
  button: ButtonBlock,
  divider: DividerAdapter,
  audio: AudioBlock,
  video: VideoBlock,
};

export function getBlockRenderer(type: BlockType): ComponentType<BlockRendererProps> | undefined {
  return BLOCK_RENDERERS[type];
}
