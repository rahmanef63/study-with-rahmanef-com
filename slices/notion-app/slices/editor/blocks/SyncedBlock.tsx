"use client";

import { useMemo } from "react";
import type { Block } from "@notion/shared/types";
import { useEditorData } from "../lib/adapterContext";
import { findSyncedSource } from "../lib/syncedBlocks";
import { SyncedSourceView, SyncedRefView } from "./synced/views";

/** Synced block — Notion-canonical reusable content. Dispatches between:
 *  - **Source** (`!syncRef`): owns `children` directly; edits propagate to refs.
 *  - **Reference** (`syncRef`): mirrors a source block by `syncId` lookup across
 *    all pages in the workspace, read/write-through to the source.
 *  Source/ref views live in ./synced/views; the recursive child list in
 *  ./synced/ChildrenList. */
export function SyncedBlockContent({
  block, pageId, onUpdate,
}: {
  block: Block;
  pageId?: string;
  onUpdate: (patch: Partial<Block>) => void;
}) {
  const { pages, workspaceId } = useEditorData();
  const isRef = !!block.syncRef;
  const sourceLookup = useMemo(
    () =>
      isRef && block.syncId
        ? findSyncedSource(block.syncId, pages, {
            excludeBlockId: block.id,
            viewerWorkspaceId: workspaceId,
          })
        : null,
    [isRef, block.syncId, block.id, pages, workspaceId],
  );

  if (isRef) {
    return (
      <SyncedRefView
        block={block}
        sourcePage={sourceLookup?.page ?? null}
        sourceBlock={sourceLookup?.block ?? null}
        cycle={!!sourceLookup?.cycle}
      />
    );
  }

  return <SyncedSourceView block={block} pageId={pageId} onUpdate={onUpdate} />;
}
