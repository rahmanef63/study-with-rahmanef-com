"use client";

/**
 * BlockEditor — per-block orchestrator (M2c port from notion-page-clone).
 * Seam mapping: useEditorWriters/useNotionAdapter → useEditorData();
 * componentsRegistry DatabaseBlock → adapter.database (SpecialBlockBody);
 * "/database — inline" → DatabasePicker, "— full page" dropped (no
 * createDatabase in the seam); paste bulk-insert → lib/insertBlocksAfter.
 */

import { memo, useCallback, useRef, useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Block, BlockType } from "@notion/shared/types";
import { useEditorData } from "./lib/adapterContext";
import { insertBlocksAfter } from "./lib/insertBlocksAfter";
import { useBlockHistory } from "./hooks/useBlockHistory";
import { SlashMenu } from "./SlashMenu";
import { BlockShell } from "./blocks/BlockShell";
import { BlockControls } from "./blocks/BlockControls";
import { BlockBody } from "./blocks/BlockBody";
import { DatabasePicker } from "./blocks/DatabasePicker";
import { ToggleBlock } from "./blocks/ToggleBlock";
import { SyncedBlockContent } from "./blocks/SyncedBlock";
import { getBlockRenderer } from "./blocks/registry";
// Side-effect import: NestedBlock self-registers into nestedRegistry on
// module load. Without this, columns / toggle blocks render with
// `nestedRegistry.Nested = undefined` (React error #130).
import "./blocks/NestedBlock";
import { useSpecialBlockBody } from "./block-editor/SpecialBlockBody";
import { useBlockDecorate } from "./block-editor/useBlockDecorate";
import { runSlashSelect } from "./block-editor/slashHandler";
import { handleBlockKeyDown } from "./block-editor/keyboardHandler";
import { handleBlockInput } from "./block-editor/inputHandler";
import { handleMarkdownPaste } from "./block-editor/pasteHandler";

interface Props {
  pageId: string;
  block: Block;
  index: number;
  total: number;
  focusByOffset: (blockId: string, delta: number) => void;
  registerRef: (id: string, el: HTMLElement | null) => void;
  /** 1-based ordinal for numbered list rendering — computed at the page
   *  level so consecutive numbered blocks get sequential labels. */
  ordinal?: number;
}

function BlockEditorBase({ pageId, block, index, total, focusByOffset, registerRef, ordinal }: Props) {
  const data = useEditorData();
  const {
    updateBlock, addBlock, deleteBlock, setBlockType, duplicateBlock,
    createPage, replaceBlock, updatePage, getPage,
  } = data;
  const [slashOpen, setSlashOpen] = useState(false);
  const [slashQuery, setSlashQuery] = useState("");
  const [askOpen, setAskOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const ref = useRef<HTMLElement | null>(null);
  const composingRef = useRef(false);
  const history = useBlockHistory(block.text);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging, isOver } =
    useSortable({ id: block.id });

  const style = { transform: CSS.Transform.toString(transform), transition };

  useBlockDecorate(ref, block, composingRef);

  const setRef = (el: HTMLElement | null) => {
    ref.current = el;
    registerRef(block.id, el);
  };

  const handleInput = (e: React.FormEvent<HTMLElement>) =>
    handleBlockInput(e, {
      pageId, block, history, composingRef,
      setBlockType, updateBlock, setSlashOpen, setSlashQuery,
    });

  const convertTo = useCallback((type: BlockType) => {
    void setBlockType(pageId, block.id, type);
  }, [pageId, block.id, setBlockType]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) =>
    handleBlockKeyDown(e, {
      pageId, block, index, total, slashOpen, history, setAskOpen,
      convertTo, duplicateBlock, addBlock, deleteBlock, setBlockType, updateBlock, focusByOffset,
    });

  const handlePaste = (e: React.ClipboardEvent<HTMLElement>) =>
    handleMarkdownPaste(e, {
      pageId, block,
      insertBlocksAfter: (args) => insertBlocksAfter(data, args),
    });

  const onSlashSelect = (type: BlockType) => {
    setSlashOpen(false);
    // "/database — inline" routes through the host's picker (the seam has no
    // createDatabase); every other type goes through the ported handler.
    if (type === "database") {
      setPickerOpen(true);
      return;
    }
    return runSlashSelect(type, {
      pageId, block, createPage, setBlockType, updateBlock, addBlock, updatePage, getPage,
      createDatabase: async () => ({ id: "" }), // unreachable — database intercepted above
    });
  };

  const shellProps = {
    setNodeRef, style, isDragging, isOver, blockId: block.id, attributes, listeners,
  } as const;
  const controls = (
    <BlockControls pageId={pageId} block={block} index={index} listeners={listeners} convertTo={convertTo} askOpen={askOpen} onAskOpenChange={setAskOpen} />
  );

  // ----- Special block types render their own UI -----
  const special = useSpecialBlockBody(pageId, block);
  if (special) {
    return <BlockShell {...shellProps} controls={controls}>{special}</BlockShell>;
  }

  if (block.type === "toggle") {
    return (
      <ToggleBlock
        pageId={pageId} block={block} index={index}
        setNodeRef={setNodeRef} style={style} isDragging={isDragging} isOver={isOver}
        attributes={attributes} listeners={listeners} convertTo={convertTo}
      />
    );
  }

  if (block.type === "synced") {
    return (
      <BlockShell {...shellProps} controls={controls}>
        <SyncedBlockContent
          block={block}
          pageId={pageId}
          onUpdate={(patch) => void updateBlock(pageId, block.id, patch)}
        />
      </BlockShell>
    );
  }

  const Renderer = getBlockRenderer(block.type);
  if (Renderer) {
    return (
      <BlockShell {...shellProps} controls={controls}>
        <Renderer
          block={block}
          pageId={pageId}
          onUpdate={(patch) => void updateBlock(pageId, block.id, patch)}
          onReplace={(next) => void replaceBlock(pageId, block.id, next)}
          registerRef={(el) => registerRef(block.id, el)}
        />
      </BlockShell>
    );
  }

  return (
    <BlockShell {...shellProps} controls={controls}>
      <BlockBody
        block={block}
        setRef={setRef}
        handleInput={handleInput}
        handleKeyDown={handleKeyDown}
        handlePaste={handlePaste}
        ordinal={ordinal}
        onCheck={(c) => void updateBlock(pageId, block.id, { checked: c })}
        onLang={(lang) => void updateBlock(pageId, block.id, { lang })}
      />
      {slashOpen && (
        <div className="absolute z-50 mt-1 left-7">
          <SlashMenu
            query={slashQuery}
            onSelect={onSlashSelect}
            onClose={() => setSlashOpen(false)}
            onSelectLinkedDatabase={() => {
              setSlashOpen(false);
              setPickerOpen(true);
            }}
          />
        </div>
      )}
      <DatabasePicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onPick={(databaseId) => {
          void setBlockType(pageId, block.id, "database");
          void updateBlock(pageId, block.id, { text: "", databaseId });
        }}
      />
    </BlockShell>
  );
}

export const BlockEditor = memo(BlockEditorBase);
