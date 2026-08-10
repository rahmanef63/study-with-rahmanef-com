"use client";

/** PropertyNameCell — inline-rename + delete affordance for a db property name.
 *  Source: notion-page-clone editor/row-properties/PropertyNameCell.tsx.
 *
 *  Seam mapping (store → props): source read `updateProperty`/`deleteProperty`
 *  from useEditorAdapter() and the type glyph from `@/shared/lib/databases/
 *  propertyTypeMeta` (PROPERTY_TYPE_ICONS — not vendored in the cluster). All
 *  three are now PROPS the host supplies:
 *   - onRename(name) / onDelete()  — persist callbacks
 *   - icon?: ComponentType         — the property-type glyph; falls back to a
 *                                    Type icon when the host omits it. */

import { useState, type ComponentType } from "react";
import { Trash2, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Property } from "@notion/shared/types";

interface Props {
  prop: Property;
  /** Property-type glyph (host-supplied — the cluster has no type-meta table). */
  icon?: ComponentType<{ className?: string }>;
  onRename: (name: string) => void;
  onDelete: () => void;
}

export function PropertyNameCell({ prop, icon, onRename, onDelete }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(prop.name);
  const Icon = icon ?? Type;

  const commit = () => {
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed && trimmed !== prop.name) {
      onRename(trimmed);
    } else {
      setDraft(prop.name);
    }
  };

  return (
    <div className="flex items-center gap-1 min-w-0 group/name">
      {editing ? (
        <Input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") {
              setEditing(false);
              setDraft(prop.name);
            }
          }}
          className="h-auto flex-1 min-w-0 rounded border-brand bg-background px-1 py-0 text-xs"
        />
      ) : (
        <>
          <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span
            className="truncate flex-1 min-w-0 cursor-default"
            onDoubleClick={() => {
              setDraft(prop.name);
              setEditing(true);
            }}
            title="Double-click to rename"
          >
            {prop.name}
          </span>
          <Button
            variant="ghost"
            onClick={onDelete}
            title="Delete property"
            className="h-auto shrink-0 rounded p-0.5 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover/name:opacity-100 [&_svg]:size-3"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </>
      )}
    </div>
  );
}
