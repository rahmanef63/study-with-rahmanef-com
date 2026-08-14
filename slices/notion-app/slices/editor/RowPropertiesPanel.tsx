"use client";

/** RowPropertiesPanel — the database-row property strip above a row page.
 *  Source: notion-page-clone editor/RowPropertiesPanel.tsx.
 *
 *  Seam mapping (store → props): the source resolved the Database from
 *  useEditorAdapter().getDatabase(page.rowOfDatabaseId) and mutated it through
 *  addProperty/updateProperty/deleteProperty — a databases store the cluster
 *  deliberately does not own. The Database + all mutation callbacks are now
 *  PROPS the host (or a wrapping BlockEditor) supplies:
 *
 *    page          : Page          — the row page (must have rowOfDatabaseId)
 *    database       : Database | undefined  — undefined → loading skeleton
 *    typeOptions    : PropertyTypeOption[]   — selectable types for "Add property"
 *    propertyIcon?  : (type) => Glyph         — per-type glyph for name cells
 *    renderCell?    : render-prop for the value editor (see PropertyRow)
 *    onAddProperty(type) / onRenameProperty(propId,name) / onDeleteProperty(propId)
 *
 *  Navigation to the parent database uses the editor seam
 *  (useEditorAdapter().page?.navigateToPage?). Database icon shown via PageIcon. */

import { useState, type ComponentType, type ReactNode } from "react";
import { ChevronRight, ChevronDown, ChevronUp } from "lucide-react";
import type { Database, Page, Property } from "@notion/shared/types";
import { useEditorAdapter } from "@notion/slices/editor/lib/adapterContext";
import { PageIcon } from "@notion/shared/ui/PageIcon";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { PropertyRow } from "./row-properties/PropertyRow";
import { AddPropertyMenu, type PropertyTypeOption } from "./row-properties/AddPropertyMenu";

/** How many visible properties show in the always-rendered preview strip
 *  before the rest collapse behind the accordion toggle. Notion-style. */
const PREVIEW_COUNT = 4;

interface Props {
  page: Page;
  /** Resolved row database — undefined renders a loading skeleton. */
  database?: Database;
  typeOptions: PropertyTypeOption[];
  propertyIcon?: (prop: Property) => ComponentType<{ className?: string }> | undefined;
  renderCell?: (args: { db: Database; prop: Property; row: Page; compact: boolean }) => ReactNode;
  onAddProperty: (type: Property["type"]) => void;
  onRenameProperty: (propId: string, name: string) => void;
  onDeleteProperty: (propId: string) => void;
}

export function RowPropertiesPanel({
  page, database: db, typeOptions, propertyIcon,
  renderCell, onAddProperty, onRenameProperty, onDeleteProperty,
}: Props) {
  const { page: pageNav } = useEditorAdapter();
  const [expanded, setExpanded] = useState(false);

  if (!page.rowOfDatabaseId) return null;
  if (!db) {
    // Database is loading or has been deleted. Render a skeleton so the page
    // doesn't appear missing its preview header — the row body renders below.
    return (
      <div className="mb-6 rounded-lg rounded-[var(--radius)] border border-border bg-card overflow-hidden">
        <Skeleton className="h-8 rounded-none border-b border-border/40 bg-muted/30" />
        <Skeleton className="h-8 rounded-none border-b border-border/40 bg-muted/20" />
        <Skeleton className="h-8 rounded-none border-b border-border/40 bg-muted/10" />
        <div className="px-3 py-2 text-xs text-muted-foreground/70 italic">
          Loading database properties…
        </div>
      </div>
    );
  }

  const visibleProps = db.properties.filter((p) => !p.hidden);
  const previewProps = visibleProps.slice(0, PREVIEW_COUNT);
  const restProps = visibleProps.slice(PREVIEW_COUNT);
  const hasRest = restProps.length > 0;

  const row = (prop: Property) => (
    <PropertyRow
      key={prop.id}
      db={db}
      prop={prop}
      row={page}
      renderCell={renderCell}
      icon={propertyIcon?.(prop)}
      onRenameProperty={(name) => onRenameProperty(prop.id, name)}
      onDeleteProperty={() => onDeleteProperty(prop.id)}
    />
  );

  return (
    <div className="mb-6">
      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => pageNav?.navigateToPage?.(db.id)}
          className="h-auto gap-1 px-0 py-0 hover:bg-transparent hover:text-foreground"
        >
          <PageIcon value={db.icon} className="text-sm" />
          <span>{db.name || "Untitled database"}</span>
        </Button>
        <ChevronRight className="h-3 w-3 shrink-0" />
        <span className="text-foreground">{page.title || "Untitled"}</span>
      </div>

      <div className="rounded-lg rounded-[var(--radius)] border border-border bg-card overflow-hidden">
        {visibleProps.length === 0 && (
          <div className="px-3 py-4 text-xs text-muted-foreground text-center">
            No properties. Add one below.
          </div>
        )}

        {previewProps.map(row)}
        {hasRest && expanded && restProps.map(row)}

        {hasRest && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            className="h-auto justify-start gap-1.5 rounded-none border-t border-border/40 px-3 py-2 text-xs font-normal text-muted-foreground hover:bg-transparent hover:text-foreground"
          >
            {expanded
              ? <ChevronUp className="h-3.5 w-3.5" />
              : <ChevronDown className="h-3.5 w-3.5" />}
            {expanded ? "Hide" : `Show ${restProps.length} more`} {restProps.length === 1 ? "property" : "properties"}
          </Button>
        )}

        <AddPropertyMenu types={typeOptions} onAdd={onAddProperty} />
      </div>
    </div>
  );
}
