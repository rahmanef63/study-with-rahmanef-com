/** "Move to" row — side-popout DropdownMenu (NOT inline accordion). Ported
 *  from notion-page-clone `slices/editor/page-actions/MoveToSubmenu.tsx`.
 *
 *  SEAM MAPPING: pages + writes via `useEditorData()` (was `useEditorAdapter`
 *  shim); the source `movePage(id, parentId)` maps to `updatePage(id,
 *  { parentId })`. Page glyphs via `@notion/shared/ui/PageIcon` (was the
 *  app's DynamicIcon). shadcn dropdown/Button + `cn` from the consumer root.
 *
 *  Lists every non-trashed, non-row page + a "Workspace root" sentinel.
 *  Excludes the page itself and its own descendants to prevent cycles. */

"use client";

import { useMemo } from "react";
import { useEditorData } from "@notion/slices/editor/lib/adapterContext";
import type { Page } from "@notion/shared/types";
import { ArrowRight, ChevronRight, Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PageIcon } from "@notion/shared/ui/PageIcon";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export function MoveToSubmenu({ page, close }: { page: Page; close: () => void }) {
  const { pages, updatePage } = useEditorData();

  const movePage = (id: string, parentId: string | null) => updatePage(id, { parentId });

  const moveCandidates = useMemo(() => {
    const isDescendant = (targetId: string, ancestorId: string): boolean => {
      let cur = pages.find((p) => p.id === targetId);
      while (cur?.parentId) {
        if (cur.parentId === ancestorId) return true;
        cur = pages.find((p) => p.id === cur!.parentId);
      }
      return false;
    };
    return pages.filter((p) =>
      !p.trashed && !p.rowOfDatabaseId && p.id !== page.id && !isDescendant(p.id, page.id),
    );
  }, [pages, page.id]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-auto w-full justify-start gap-2 rounded-none px-3 py-1.5 text-sm font-normal [&_svg]:size-3.5 data-[state=open]:bg-accent"
        >
          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="flex-1 text-left">Move to</span>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="right" align="start" sideOffset={4} className="w-64 max-h-80 overflow-y-auto scrollbar-thin">
        <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Move into
        </DropdownMenuLabel>
        <DropdownMenuItem
          onClick={() => { movePage(page.id, null); toast.success("Moved to root"); close(); }}
          className={cn("gap-2 text-xs", page.parentId === null && "text-muted-foreground")}
        >
          {page.parentId === null
            ? <Check className="h-3 w-3" />
            : <span className="w-3" />}
          <span className="flex-1">Workspace root</span>
        </DropdownMenuItem>
        {moveCandidates.length === 0 && (
          <div className="px-2 py-2 text-xs text-muted-foreground">No other pages</div>
        )}
        {moveCandidates.length > 0 && <DropdownMenuSeparator />}
        {moveCandidates.map((p) => (
          <DropdownMenuItem
            key={p.id}
            onClick={() => { movePage(page.id, p.id); toast.success(`Moved into ${p.title || "Untitled"}`); close(); }}
            className={cn("gap-2 text-xs", page.parentId === p.id && "text-muted-foreground")}
          >
            {page.parentId === p.id
              ? <Check className="h-3 w-3" />
              : <span className="w-3" />}
            <PageIcon value={p.icon} className="text-sm" />
            <span className="flex-1 truncate">{p.title || "Untitled"}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
