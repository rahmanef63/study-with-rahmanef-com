import { useMemo, useState } from "react";
import { MoreHorizontal, Search } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import type { Block, BlockType } from "@notion/shared/types";
import {
  useEditorData as useEditorAdapter,
  useSelection,
  useComments,
  useAi,
} from "@notion/slices/editor/lib/adapterContext";
import { BLOCK_SPECS } from "../blockSpecs";
import { buildActionRows, filterActionRows } from "./block-controls/searchRows";
import { MenuHierarchy } from "./block-controls/MenuHierarchy";
import { GripButton } from "./block-controls/QuickButtons";
import { Button } from "@/components/ui/button";

interface Props {
  pageId: string;
  block: Block;
  index: number;
  listeners?: import("@dnd-kit/core/dist/hooks/utilities").SyntheticListenerMap;
  convertTo: (t: BlockType) => void;
  askOpen?: boolean;
  onAskOpenChange?: (o: boolean) => void;
}

export function BlockControls({ pageId, block, index, listeners, convertTo, askOpen, onAskOpenChange }: Props) {
  const { addBlock, deleteBlock, duplicateBlock, updateBlock, user, getPage } = useEditorAdapter();
  const { useBlockComments } = useComments();
  const ai = useAi();
  const { openCount, create } = useBlockComments(block.id);
  const sel = useSelection();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [askOpenLocal, setAskOpenLocal] = useState(false);
  const askIsOpen = askOpen ?? askOpenLocal;
  const setAskOpen = onAskOpenChange ?? setAskOpenLocal;

  const currentSpec = BLOCK_SPECS.find((s) => s.type === block.type);
  const currentLabel = currentSpec?.label ?? block.type;
  const page = getPage(pageId);
  const lastEditedAt = page?.updatedAt;

  const actionRows = useMemo(
    () => buildActionRows({ pageId, index, addBlock, convertTo }),
    [addBlock, convertTo, pageId, index],
  );
  const filteredRows = useMemo(() => filterActionRows(actionRows, q), [q, actionRows]);

  const closeMenu = () => { setOpen(false); setQ(""); };

  return (
    <Popover open={askIsOpen} onOpenChange={setAskOpen}>
      <PopoverAnchor asChild>
        <div className="flex">
          <DropdownMenu open={open} onOpenChange={(o) => { setOpen(o); if (!o) setQ(""); }}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                title="Block menu"
                aria-label="Block menu"
                className="h-6 w-5 text-muted-foreground"
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" side="right" className="w-64 p-0">
              <div className="p-2 border-b border-border">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    autoFocus
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key !== "Escape" && e.key !== "ArrowDown" && e.key !== "ArrowUp") {
                        e.stopPropagation();
                      }
                    }}
                    placeholder="Search actions…"
                    className="h-auto w-full border-border pl-7 pr-2 py-1.5 text-sm"
                  />
                </div>
              </div>
              <div className="max-h-[420px] overflow-y-auto py-1">
                {q.trim() ? (
                  filteredRows.length === 0 ? (
                    <div className="px-3 py-6 text-center text-xs text-muted-foreground">
                      No actions match &ldquo;{q}&rdquo;.
                    </div>
                  ) : (
                    filteredRows.map((r) => (
                      <DropdownMenuItem
                        key={r.key}
                        onSelect={async (e) => { e.preventDefault(); await r.run(); closeMenu(); }}
                      >
                        <r.icon className="mr-2 h-3.5 w-3.5" /> {r.label}
                      </DropdownMenuItem>
                    ))
                  )
                ) : (
                  <MenuHierarchy
                    pageId={pageId} block={block} index={index}
                    currentLabel={currentLabel} lastEditedAt={lastEditedAt}
                    user={user} openCount={openCount} sel={sel ?? null}
                    closeMenu={closeMenu} setAskOpen={setAskOpen} convertTo={convertTo}
                    addBlock={addBlock} deleteBlock={deleteBlock} duplicateBlock={duplicateBlock}
                    updateBlock={updateBlock} createComment={create}
                  />
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          <GripButton listeners={listeners} />
        </div>
      </PopoverAnchor>
      {ai && (
        <PopoverContent className="w-80 p-2" align="start" side="bottom" sideOffset={6}>
          <ai.AskAIPanel pageId={pageId} block={block} index={index} onClose={() => setAskOpen(false)} />
        </PopoverContent>
      )}
    </Popover>
  );
}
