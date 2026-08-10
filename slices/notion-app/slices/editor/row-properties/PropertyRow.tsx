"use client";

/** PropertyRow — one name/value row inside the row-properties panel.
 *  Source: notion-page-clone editor/row-properties/PropertyRow.tsx.
 *
 *  Seam mapping (registry → props): source pulled the value editor from
 *  `useEditorComponents().PropertyCell` (an editor-local component registry not
 *  vendored in the cluster). That cell is now a `renderCell` RENDER-PROP the
 *  host supplies; when omitted the row shows an inert placeholder. Rename/delete
 *  + the type glyph are threaded down to PropertyNameCell as props. */

import type { ComponentType, ReactNode } from "react";
import type { Database, Page, Property } from "@notion/shared/types";
import { PropertyNameCell } from "./PropertyNameCell";

interface Props {
  db: Database;
  prop: Property;
  row: Page;
  /** Host-rendered value editor for (db, prop, row). Omit → placeholder. */
  renderCell?: (args: { db: Database; prop: Property; row: Page; compact: boolean }) => ReactNode;
  /** Property-type glyph (host owns the type-meta table). */
  icon?: ComponentType<{ className?: string }>;
  onRenameProperty: (name: string) => void;
  onDeleteProperty: () => void;
}

export function PropertyRow({ db, prop, row, renderCell, icon, onRenameProperty, onDeleteProperty }: Props) {
  return (
    <div className="flex items-start border-b border-border/40 last:border-0 min-h-[32px]">
      <div className="text-xs text-muted-foreground flex items-center gap-1.5 px-2 py-1.5 shrink-0 border-r border-border/40 w-40">
        <PropertyNameCell prop={prop} icon={icon} onRename={onRenameProperty} onDelete={onDeleteProperty} />
      </div>
      <div className="flex-1 min-w-0">
        {renderCell ? (
          renderCell({ db, prop, row, compact: true })
        ) : (
          <div className="px-2 py-1.5 text-xs text-muted-foreground italic">
            Property cell not provided
          </div>
        )}
      </div>
    </div>
  );
}
