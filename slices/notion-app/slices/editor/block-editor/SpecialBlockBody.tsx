"use client";

/**
 * Special-type block bodies split out of BlockEditor (M2c, 200-line cap).
 * Covers the two types whose rendering hangs off the adapter seam:
 * - "page"     → PageRefBlock (nav via adapter.page)
 * - "database" → adapter.database.renderDatabase, placeholder when unwired
 *   (the source resolved this through its componentsRegistry — dropped; the
 *   DatabaseAdapter seam IS the dependency boundary now).
 */

import type { ReactNode } from "react";
import type { Block } from "@notion/shared/types";
import { useEditorAdapter } from "../lib/adapterContext";
import { PageRefBlock } from "./PageRefBlock";

/** Hook — call unconditionally; returns null for ordinary block types. */
export function useSpecialBlockBody(pageId: string, block: Block): ReactNode | null {
  const { database } = useEditorAdapter();
  void pageId;

  if (block.type === "page") {
    return <PageRefBlock block={block} />;
  }

  if (block.type === "database") {
    const rendered = block.databaseId
      ? database?.renderDatabase(block.databaseId, block.id)
      : null;
    return (
      rendered ?? (
        <div className="rounded border border-dashed border-border bg-muted/30 p-3 text-xs text-muted-foreground">
          Database block — wire <code>adapter.database.renderDatabase</code> on
          the EditorAdapterProvider to mount your database renderer.
        </div>
      )
    );
  }

  return null;
}
