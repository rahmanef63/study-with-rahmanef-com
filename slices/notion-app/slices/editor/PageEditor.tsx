"use client";

/**
 * PageEditor — page-level orchestrator (M2c port from notion-page-clone).
 * Seam mapping: route param → `pageId` prop; store → useEditorData().
 * DROPPED (host chrome, outside the seam): PageHeaderSlot, page comments +
 * backlinks panels, ShareDialog/VersionHistory, block-selection overlays,
 * pushRecent, read receipts, inline-AI shortcut, legacy host-db redirect,
 * componentsRegistry (database blocks resolve via adapter.database).
 * Row-properties renders through the `renderRowProperties` host slot.
 */

import { useCallback, useRef, type ReactNode } from "react";
import {
  DndContext, closestCenter, pointerWithin, KeyboardSensor, PointerSensor,
  useSensor, useSensors, type CollisionDetection,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Page } from "@notion/shared/types";
import { useEditorData } from "./lib/adapterContext";
import { BlockEditor } from "./BlockEditor";
import { useFullPage } from "./hooks/useFullPage";
import { usePageHashScroll } from "./hooks/usePageHashScroll";
import { useBlockMoveShortcut } from "./hooks/useBlockMoveShortcut";
import { handlePageDragEnd, getSelectedTopLevelIds } from "./lib/pageDragEnd";
import { prioritizeCollisions } from "./lib/collisionPriority";
import { adaptPageLayouts, groupBlocksIntoChunks } from "./lib/layoutAdapter";
import { ColumnLayoutGroup } from "./components/ColumnLayoutGroup";
import { ordinalsOf } from "./page-editor/ordinals";
import { CoverStrip } from "./page-editor/CoverStrip";
import { PageHeaderRow } from "./page-editor/PageHeaderRow";
import { PageTitle } from "./page-editor/PageTitle";
import { Subpages } from "./page-editor/Subpages";
import { PageNotFound } from "./page-editor/PageNotFound";

export interface PageEditorProps {
  pageId: string;
  /** Host slot for the database-row properties panel (page.rowOfDatabaseId
   *  pages) — composing it needs the host's database capability, so the
   *  editor only reserves the position. */
  renderRowProperties?: (page: Page) => ReactNode;
  /** Breadcrumbs + favorite + "•••" strip. Default true; see PageHeaderRow
   *  for why a host with no page-level columns turns it off. */
  showHeader?: boolean;
  /** "Pages inside" grid. Default true; pointless for a single-document host
   *  whose `createPage` is a no-op. */
  showSubpages?: boolean;
  className?: string;
}

export function PageEditor({
  pageId, renderRowProperties, showHeader = true, showSubpages = true, className,
}: PageEditorProps) {
  const { updatePage, addBlock, childrenOf } = useEditorData();
  const fullPageRaw = useFullPage(pageId);
  // Virtualize legacy `columns2..5` blocks into the layout-primitive shape on
  // read; writes persist the flattened form, so pages migrate on first edit.
  const page = fullPageRaw ? adaptPageLayouts(fullPageRaw) : undefined;
  const refs = useRef<Map<string, HTMLElement | null>>(new Map());
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const blocksRef = useRef(page?.blocks);
  blocksRef.current = page?.blocks;
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  usePageHashScroll(pageId);
  useBlockMoveShortcut({ pageId, blocksRef, updatePage });

  const registerRef = useCallback((bid: string, el: HTMLElement | null) => {
    refs.current.set(bid, el);
  }, []);
  const focusByOffset = useCallback((blockId: string, delta: number) => {
    const blocks = blocksRef.current;
    if (!blocks) return;
    const idx = blocks.findIndex((b) => b.id === blockId);
    const target = idx === -1 ? undefined : blocks[idx + delta];
    if (target) refs.current.get(target.id)?.focus();
  }, []);

  if (!page || page.trashed) return <PageNotFound />;

  const chunks = groupBlocksIntoChunks(page.blocks, page.layouts);
  const ordinals = ordinalsOf(page.blocks);

  const renderOneBlock = (b: (typeof page.blocks)[number], i: number) => (
    <BlockEditor
      key={b.id}
      pageId={page.id}
      block={b}
      index={i}
      total={page.blocks.length}
      registerRef={registerRef}
      focusByOffset={focusByOffset}
      ordinal={ordinals.get(b.id)}
    />
  );

  const addToColumn = async (layoutId: string, col: number) => {
    const blocks = blocksRef.current ?? [];
    let insertAfter = -1;
    for (let i = 0; i < blocks.length; i++) {
      if (blocks[i].layoutGroup === layoutId) insertAfter = i;
    }
    if (insertAfter === -1) insertAfter = blocks.length - 1;
    const newId = await addBlock(page.id, insertAfter, "paragraph", { layoutGroup: layoutId, layoutCol: col });
    setTimeout(() => document.querySelector<HTMLElement>(`[data-block-id="${newId}"]`)?.focus(), 0);
  };

  const commitLayoutWidths = (layoutId: string, next: number[]) => {
    const layouts = (page.layouts ?? []).map((l) => (l.id === layoutId ? { ...l, widths: next } : l));
    void updatePage(page.id, { layouts });
  };

  const collisionDetection: CollisionDetection = (args) => {
    const prioritized = prioritizeCollisions(pointerWithin(args));
    return prioritized.length ? prioritized : closestCenter(args);
  };

  const subpages = childrenOf(page.id);

  return (
    <div className={cn("flex h-full flex-col overflow-hidden", className)}>
      {showHeader && <PageHeaderRow page={page} />}

      <div ref={scrollRef} className="relative flex-1 overflow-y-auto">
        {page.cover && <CoverStrip cover={page.cover} />}

        <div
          className={cn(
            "mx-auto px-4 sm:px-6 md:px-12",
            page.fullWidth ? "max-w-none" : "max-w-3xl",
            // relative+z-10 lifts title/icon above the cover overlap.
            page.cover ? "relative z-10 -mt-10" : "pt-16",
            page.font === "serif" && "font-serif",
            page.font === "mono" && "font-mono",
            page.smallText && "text-[14px]",
          )}
        >
          <PageTitle page={page} firstBlockRef={refs} />

          {page.rowOfDatabaseId && renderRowProperties?.(page)}

          <div
            {...(page.locked ? { inert: "" as unknown as boolean } : {})}
            className={cn("mt-6 pb-32 prose-editor", page.locked && "opacity-90 select-text")}
          >
            <DndContext
              sensors={sensors}
              collisionDetection={collisionDetection}
              onDragEnd={(e) =>
                handlePageDragEnd(e, {
                  page,
                  updatePage: (id, patch) => void updatePage(id, patch),
                  selectedIds: getSelectedTopLevelIds(page.blocks),
                })
              }
            >
              <SortableContext items={page.blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
                {chunks.map((chunk) => {
                  if (chunk.kind === "block") return renderOneBlock(chunk.block, chunk.index);
                  return (
                    <ColumnLayoutGroup
                      key={`layout-${chunk.layout.id}`}
                      layout={chunk.layout}
                      columns={chunk.columns}
                      pageId={page.id}
                      page={page}
                      renderBlock={renderOneBlock}
                      onAddBlockInColumn={(c) => addToColumn(chunk.layout.id, c)}
                      onCommitWidths={(next) => commitLayoutWidths(chunk.layout.id, next)}
                    />
                  );
                })}
              </SortableContext>
            </DndContext>

            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                const newId = await addBlock(page.id, page.blocks.length - 1);
                setTimeout(() => document.querySelector<HTMLElement>(`[data-block-id="${newId}"]`)?.focus(), 0);
              }}
              className="mt-2 h-auto px-0 py-0 text-muted-foreground hover:bg-transparent hover:text-foreground"
            >
              + Add block
            </Button>

            {showSubpages && <Subpages page={page} subpages={subpages} />}
          </div>
        </div>
      </div>
    </div>
  );
}
