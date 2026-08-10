"use client";

/** AddPropertyMenu — dropdown to append a new property of a chosen type.
 *  Source: notion-page-clone editor/row-properties/AddPropertyMenu.tsx.
 *
 *  Seam mapping (store → props): source enumerated every type via
 *  `@/shared/lib/databases/propertyTypeMeta` (PROPERTY_TYPE_LABELS / _ICONS),
 *  which the cluster does not vendor. The selectable type list is now a PROP
 *  the host supplies (it owns the property-type metadata table). */

import { Plus, Type } from "lucide-react";
import { useState, type ComponentType } from "react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import type { PropertyType } from "@notion/shared/types";

export interface PropertyTypeOption {
  type: PropertyType;
  label: string;
  icon?: ComponentType<{ className?: string }>;
}

interface Props {
  /** Host-supplied selectable property types (label + optional glyph). */
  types: PropertyTypeOption[];
  onAdd: (type: PropertyType) => void;
}

export function AddPropertyMenu({ types, onAdd }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-t border-border/40">
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-auto w-full justify-start gap-1.5 px-3 py-2 text-xs font-normal text-muted-foreground transition-colors hover:bg-transparent hover:text-foreground [&_svg]:size-3.5">
            <Plus className="h-3.5 w-3.5" />
            Add property
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          {types.map(({ type, label, icon: Icon }) => (
            <DropdownMenuItem key={type} onClick={() => { onAdd(type); setOpen(false); }}>
              {Icon ? <Icon className="mr-2 h-3.5 w-3.5 text-muted-foreground" /> : <Type className="mr-2 h-3.5 w-3.5 text-muted-foreground" />}
              {label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
