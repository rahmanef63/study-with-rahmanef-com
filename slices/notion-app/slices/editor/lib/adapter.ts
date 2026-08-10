import type { ComponentType, ReactNode } from "react";
import type { Block, Page } from "@notion/shared/types";
import type { EditorDataAdapter } from "./dataAdapter";

/**
 * EditorAdapter — the seam that decouples the block editor from its host app.
 *
 * In notion-page-clone the editor imported ~13 sibling slices directly
 * (comments, databases, mentions, cover, block-selection, wiki, backlinks,
 * analytics, sharing, snapshots, notifications, workspace-io) — which breaks
 * rr's slice-isolation contract. Here those integrations INVERT: the host
 * passes whatever it has; everything is optional, and the editor degrades
 * gracefully when a capability is absent (no comments adapter → no comment
 * affordances; no database adapter → database blocks render a placeholder).
 *
 * This is the same renderless-adapter pattern the `comments` slice uses.
 * Milestone 1 defines the boundary; component ports in later milestones wire
 * against it instead of reaching into peer slices.
 */

/** Multi-block selection store (was @/slices/block-selection). Mirrors the
 *  source `useBlockSelectionOptional()` surface the block chrome calls. */
export interface SelectionAdapter {
  isSelected: (blockId: string) => boolean;
  /** Replace the selection with just this block. */
  selectOne: (blockId: string) => void;
  /** Add/remove this block from the selection (⌘/ctrl-click). */
  toggle: (blockId: string) => void;
  /** Extend the selection to this block (shift-click). */
  range: (blockId: string) => void;
}

/** Per-block comment state (open count + create), mirroring the source
 *  `useBlockComments(blockId)` hook return. */
export interface BlockCommentsState {
  openCount: number;
  create: (text: string) => void | Promise<void>;
}

/** Comment affordances on a block (was @/slices/comments). Modelled as a
 *  hook + a popover component so the chrome can call them unconditionally;
 *  the cluster supplies a no-op default (DEFAULT_COMMENTS) when the host
 *  wires none, keeping rules-of-hooks satisfied. */
export interface CommentsAdapter {
  useBlockComments: (blockId: string) => BlockCommentsState;
  BlockCommentsPopover: ComponentType<{
    pageId: string;
    blockId: string;
    trigger: ReactNode;
  }>;
}

/** Inline "Ask AI" panel for a block (was @/slices/notion AI). Optional —
 *  the chrome hides the affordance when absent. */
export interface AiAdapter {
  AskAIPanel: ComponentType<{
    pageId: string;
    block: Block;
    index: number;
    onClose: () => void;
  }>;
}

export const DEFAULT_COMMENTS: CommentsAdapter = {
  useBlockComments: () => ({ openCount: 0, create: () => {} }),
  BlockCommentsPopover: () => null,
};

/** Database block + picker (was @/slices/databases). */
export interface DatabaseAdapter {
  /** Render an embedded database by id; null → editor shows a placeholder. */
  renderDatabase: (databaseId: string, blockId: string) => ReactNode;
  /** Host-driven database picker for the /database slash command. */
  pickDatabase: () => Promise<string | null>;
}

/** @-mention typeahead (was @/slices/mentions). */
export interface MentionAdapter {
  search: (query: string) => Promise<MentionResult[]>;
  resolveHref: (id: string) => string | null;
}
export interface MentionResult {
  id: string;
  label: string;
  icon?: string;
}

/** Page-level integrations (cover, navigation, uploads). */
export interface PageAdapter {
  /** Resolve a child page by id (page-ref block, was @/slices/notion). */
  getPage?: (pageId: string) => Page | undefined;
  /** Navigate to a page (was @/shared/lib/router). */
  navigateToPage?: (pageId: string) => void;
  /** Upload a file → returns a URL (image/audio/video blocks). */
  uploadFile?: (file: File) => Promise<string>;
}

/**
 * The full adapter. Every field optional — an editor mounted with `{}` is a
 * fully functional plain-text/markdown block editor; richer host capabilities
 * light up as adapters are supplied.
 */
export interface EditorAdapter {
  /** Block + page CRUD. Absent → a no-op data layer (read-only editor). */
  data?: EditorDataAdapter;
  selection?: SelectionAdapter;
  comments?: CommentsAdapter;
  ai?: AiAdapter;
  database?: DatabaseAdapter;
  mention?: MentionAdapter;
  page?: PageAdapter;
  /** Persist a changed block list for a page (was @/shared/lib/store). */
  onChange?: (pageId: string, blocks: Block[]) => void;
}
