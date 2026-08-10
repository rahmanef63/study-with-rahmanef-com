import type { Block, BlockType, Page } from "@notion/shared/types";

/** Minimal author identity the editor chrome surfaces (avatars, "last edited
 *  by"). Vendored subset of the source UserProfile. */
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  icon: string;
  color: string;
  bio: string;
}

/**
 * The editor's DATA layer — block + page CRUD. In notion-page-clone this was
 * `useEditorAdapter()`, a shim over the app's Convex store. Here the host
 * supplies it through the EditorAdapter seam (`adapter.data`). Read-only block
 * RENDERING works without it; editing chrome needs it. When absent the cluster
 * falls back to a no-op (see adapterContext) so nothing throws.
 */
export interface EditorDataAdapter {
  user: UserProfile;
  /** All pages in the active workspace — used for cross-page lookups
   *  (synced-block source resolution). Empty when the host wires none. */
  pages: Page[];
  /** Active workspace id, for scoping cross-page lookups. */
  workspaceId?: string;
  getPage: (id: string) => Page | undefined;
  childrenOf: (parentId: string | null) => Page[];

  // Block writes
  addBlock: (pageId: string, afterIndex: number, type?: BlockType, init?: Partial<Block>) => Promise<string>;
  updateBlock: (pageId: string, blockId: string, patch: Partial<Block>) => Promise<void>;
  deleteBlock: (pageId: string, blockId: string) => Promise<void>;
  duplicateBlock: (pageId: string, blockId: string) => Promise<string>;
  reorderBlocks: (pageId: string, orderedIds: string[]) => Promise<void>;
  setBlockType: (pageId: string, blockId: string, type: BlockType) => Promise<void>;
  replaceBlock: (pageId: string, blockId: string, nextBlock: Block) => Promise<void>;

  // Page writes (subpages, page-ref, nested pages)
  createPage: (parentId?: string | null, opts?: Partial<Page>) => Promise<{ id: string }>;
  updatePage: (pageId: string, patch: Partial<Page>) => Promise<void>;
  deletePage: (id: string) => Promise<void>;
  duplicatePage: (id: string) => Promise<{ id: string } | null>;
}

export const DEFAULT_USER: UserProfile = {
  id: "", name: "", email: "", icon: "", color: "", bio: "",
};

/** No-op data adapter — used when the host supplies none. Editing affordances
 *  become inert (reads return empty, writes resolve without effect) instead of
 *  throwing, so a standalone read-only editor still mounts. */
export const NOOP_DATA_ADAPTER: EditorDataAdapter = {
  user: DEFAULT_USER,
  pages: [],
  getPage: () => undefined,
  childrenOf: () => [],
  addBlock: async () => "",
  updateBlock: async () => {},
  deleteBlock: async () => {},
  duplicateBlock: async () => "",
  reorderBlocks: async () => {},
  setBlockType: async () => {},
  replaceBlock: async () => {},
  createPage: async () => ({ id: "" }),
  updatePage: async () => {},
  deletePage: async () => {},
  duplicatePage: async () => null,
};
