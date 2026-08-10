"use client";

/**
 * PageActionsMenu — "•••" page menu (M2c port from notion-page-clone).
 * Seam mapping: actions via page-actions/usePageActions (data adapter).
 * DROPPED (peer slices outside the seam): WikiToggleAction, AnalyticsPopover,
 * NotifyMePopover, MentionsPopover. "Version history" renders only when the
 * host passes `onShowHistory`. Search input → shadcn Input.
 */

import { useEffect, useState } from "react";
import {
  MoreHorizontal, Search, Ruler, MoveHorizontal,
  Link2, ClipboardCopy, Files, Trash2,
  Palette, Lock, Unlock,
  Sparkles, MessageSquare, Languages, History,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Page } from "@notion/shared/types";
import { FONT_OPTIONS } from "./page-actions/fonts";
import { Row, ToggleRow, SectionLabel } from "./page-actions/MenuRows";
import { MoveToSubmenu } from "./page-actions/MoveToSubmenu";
import { DataSubmenu } from "./page-actions/DataSubmenu";
import { usePageActions } from "./page-actions/usePageActions";

interface Props {
  page: Page;
  /** Host hook for the version-history pane; row hidden when absent. */
  onShowHistory?: () => void;
}

export function PageActionsMenu({ page, onShowHistory }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const close = () => setOpen(false);
  const actions = usePageActions(page, close);

  useEffect(() => { if (!open) setQuery(""); }, [open]);

  const q = query.trim().toLowerCase();
  const match = (label: string) => !q || label.toLowerCase().includes(q);
  const groupVisible = (...labels: string[]) => labels.some(match);
  const ALL_LABELS = [
    "Small text", "Full width", "Copy link", "Copy page contents", "Duplicate",
    "Move to", "Move to Trash", "Customize page", "Lock page", "Use with AI",
    "Suggest edits", "Translate", "Data", "Version history",
  ];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" aria-label="Page actions">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[280px] p-0 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center gap-2 border-b border-border px-3 py-2">
          <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search actions..."
            className="h-6 flex-1 border-0 bg-transparent p-0 text-xs shadow-none focus-visible:ring-0"
          />
        </div>

        {!q && (
          <div className="grid grid-cols-3 gap-1 p-2 border-b border-border">
            {FONT_OPTIONS.map((opt) => {
              const active = (page.font ?? "default") === opt.id;
              return (
                <Button
                  variant="outline"
                  key={opt.id}
                  onClick={() => actions.setFont(opt.id)}
                  className={cn(
                    "h-auto flex-col rounded-md py-2 text-center font-normal transition",
                    opt.className,
                    active ? "border-foreground bg-accent" : "hover:bg-accent/50",
                  )}
                >
                  <div className="text-base font-semibold leading-none">Ag</div>
                  <div className="mt-1 text-[10px] text-muted-foreground">{opt.label}</div>
                </Button>
              );
            })}
          </div>
        )}

        {groupVisible("Small text", "Full width") && (
          <div className="border-b border-border py-1">
            {match("Small text") && (
              <ToggleRow icon={Ruler} label="Small text" checked={!!page.smallText} onChange={actions.toggleSmall} />
            )}
            {match("Full width") && (
              <ToggleRow icon={MoveHorizontal} label="Full width" checked={!!page.fullWidth} onChange={actions.toggleFull} />
            )}
          </div>
        )}

        {groupVisible("Copy link", "Copy page contents", "Duplicate", "Move to", "Move to Trash") && (
          <div className="border-b border-border py-1">
            {match("Copy link") && (
              <Row icon={Link2} label="Copy link" shortcut="Ctrl+Alt+L" onClick={actions.copyLink} />
            )}
            {match("Copy page contents") && (
              <Row icon={ClipboardCopy} label="Copy page contents" onClick={actions.copyContents} />
            )}
            {match("Duplicate") && (
              <Row icon={Files} label="Duplicate" shortcut="Ctrl+D" onClick={actions.onDuplicate} />
            )}
            {match("Move to") && <MoveToSubmenu page={page} close={close} />}
            {match("Move to Trash") && (
              <Row icon={Trash2} label="Move to Trash" onClick={actions.onTrash} destructive />
            )}
          </div>
        )}

        {groupVisible("Customize page", "Lock page") && (
          <div className="border-b border-border py-1">
            {match("Customize page") && (
              <Row icon={Palette} label="Customize page" onClick={actions.stub("Customize page")} />
            )}
            {match("Lock page") && (
              <ToggleRow
                icon={page.locked ? Lock : Unlock}
                label="Lock page"
                checked={!!page.locked}
                onChange={actions.toggleLock}
              />
            )}
          </div>
        )}

        {groupVisible("Use with AI", "Suggest edits", "Translate") && (
          <div className="border-b border-border py-1">
            <SectionLabel>AI</SectionLabel>
            {match("Use with AI") && <Row icon={Sparkles} label="Use with AI" onClick={actions.stub("Use with AI")} />}
            {match("Suggest edits") && <Row icon={MessageSquare} label="Suggest edits" onClick={actions.stub("Suggest edits")} />}
            {match("Translate") && <Row icon={Languages} label="Translate" onClick={actions.stub("Translate")} />}
          </div>
        )}

        {groupVisible("Data", "Version history") && (
          <div className="py-1">
            {match("Data") && (
              <DataSubmenu
                close={close}
                actions={{
                  onExportPdf: actions.onExportPdf,
                  onExportMd: actions.onExportMd,
                  onExportHtml: actions.onExportHtml,
                  onExportTxt: actions.onExportTxt,
                  onExportJson: actions.onExportJson,
                  onImportMd: actions.onImportMd,
                  onImportJson: actions.onImportJson,
                  onImportZip: actions.onImportZip,
                }}
              />
            )}
            {onShowHistory && match("Version history") && (
              <Row icon={History} label="Version history" onClick={() => { close(); onShowHistory(); }} />
            )}
          </div>
        )}

        {q && !groupVisible(...ALL_LABELS) && (
          <div className="px-3 py-6 text-center text-xs text-muted-foreground">No matching actions</div>
        )}
      </PopoverContent>
    </Popover>
  );
}
