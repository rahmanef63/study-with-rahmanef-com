// notion-editor inner slice — public surface.
//
// M2c: the composed editor. Mount <PageEditor pageId> inside an
// <EditorAdapterProvider adapter={...}> — with `{}` it's a read-only
// plain-text/markdown editor; capabilities light up per adapter.

// Composed surfaces
export { PageEditor, type PageEditorProps } from "./PageEditor";
export { BlockEditor } from "./BlockEditor";
export { PageActionsMenu } from "./PageActionsMenu";
export { RowPropertiesPanel } from "./RowPropertiesPanel";
export { SelectionToolbar } from "./components/SelectionToolbar";
export { MentionTypeahead } from "./components/MentionTypeahead";
export { DatabasePicker } from "./blocks/DatabasePicker";
export { TocBlock } from "./blocks/TocBlock";
export { CoverStrip } from "./page-editor/CoverStrip";
export { PageEditorSkeleton } from "./page-editor/PageEditorSkeleton";
export { usePageActions } from "./page-actions/usePageActions";
export { useBlockHistory } from "./hooks/useBlockHistory";
export { insertBlocksAfter } from "./lib/insertBlocksAfter";
export { handlePageDragEnd, getSelectedTopLevelIds } from "./lib/pageDragEnd";

// Block model + slash specs
export { BLOCK_SPECS, type BlockSpec } from "./blockSpecs";

// The host-integration seam — interfaces + runtime provider/hooks
export type {
  EditorAdapter,
  SelectionAdapter,
  CommentsAdapter,
  BlockCommentsState,
  AiAdapter,
  DatabaseAdapter,
  MentionAdapter,
  MentionResult,
  PageAdapter,
} from "./lib/adapter";
export type { EditorDataAdapter, UserProfile } from "./lib/dataAdapter";
export {
  EditorAdapterProvider,
  useEditorAdapter,
  useEditorData,
  useSelection,
  useComments,
  useAi,
} from "./lib/adapterContext";

// Block chrome — selection-aware wrapper + the per-block toolbar (menu,
// quick buttons, grip) wired to the data/selection/comments/ai adapters.
export { BlockShell } from "./blocks/BlockShell";
export { BlockControls } from "./blocks/BlockControls";
export { QuickButtons, GripButton } from "./blocks/block-controls/QuickButtons";
export { MenuHierarchy } from "./blocks/block-controls/MenuHierarchy";

// Nested-rendering subtree — recursive block dispatcher + container blocks.
// Importing NestedBlock registers it into the nested-render registry
// (side-effect) so container blocks can resolve it via requireNested().
export { NestedBlock } from "./blocks/NestedBlock";
export { NestedBlockControls } from "./blocks/NestedBlockControls";
export { NestedContent } from "./blocks/nested-block/NestedContent";
export { ToggleBlock, ToggleContent } from "./blocks/ToggleBlock";
export { ColumnBlockEditor } from "./ColumnBlockEditor";
export { SyncedBlockContent } from "./blocks/SyncedBlock";
export { requireNested, nestedRegistry } from "./blocks/nestedRegistry";

// Block rendering — content body + special-block renderer registry
export { BlockBody } from "./blocks/BlockBody";
export { SimpleCodeBlock } from "./blocks/SimpleCodeBlock";
export {
  BLOCK_RENDERERS,
  getBlockRenderer,
  type BlockRendererProps,
} from "./blocks/registry";

// Slash command menu
export { SlashMenu } from "./SlashMenu";

// Pure block-operation utilities
export { BLOCK_COLORS, BLOCK_COLOR_KEYS, colorClass, bgColorClass, type BlockColorKey } from "./lib/colors";
export * from "./lib/blockTree";
export * from "./lib/turnInto";
export * from "./lib/markdownTriggers";
export * from "./lib/listOrdinals";
export * from "./lib/syncedBlocks";
export * from "./lib/layoutAdapter";
export * from "./lib/collisionPriority";
export * from "./lib/focusBlock";
export * from "./lib/inlineDecorator";
export * from "./lib/covers";
