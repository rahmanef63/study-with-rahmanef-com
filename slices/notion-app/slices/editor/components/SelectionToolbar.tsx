"use client";

/** SelectionToolbar — floating inline-format toolbar over a text selection.
 *  Source: notion-page-clone editor/components/SelectionToolbar.tsx.
 *
 *  Seam mapping:
 *   - markdown wrap/strip → @notion/shared/lib/inlineMd (stripMd) + local helpers
 *     (selection-toolbar/{range,types,Btn}).
 *   - source `useNotionAdapter().ai.complete` (inline AI rewrite over the
 *     selection) had NO equivalent in the editor seam: AiAdapter exposes only a
 *     block-scoped <AskAIPanel> component, not a selection text-completion
 *     function. The "AI actions" preset menu (improve/shorter/longer/grammar/
 *     translate) is therefore DROPPED. See report — to restore it the host must
 *     extend AiAdapter with a `complete({messages,system,maxTokens})` fn.
 *
 *  Wraps the selected text with markdown markers in-place; the editor stores
 *  innerText so markers persist and readers parse them via inlineMd. */

import * as React from "react";
import { Bold, Italic, Code, Strikethrough, Link2, Eraser } from "lucide-react";
import { cn } from "@/lib/utils";
import { stripMd } from "@notion/shared/lib/inlineMd";
import { WRAP, type Mark } from "./selection-toolbar/types";
import { closestContentEditable, replaceRange } from "./selection-toolbar/range";
import { Btn } from "./selection-toolbar/Btn";

export function SelectionToolbar() {
  const [pos, setPos] = React.useState<{ x: number; y: number } | null>(null);
  const rangeRef = React.useRef<Range | null>(null);
  const applyRef = React.useRef<(m: Mark) => void>(() => {});

  React.useEffect(() => {
    function update() {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
        setPos(null);
        rangeRef.current = null;
        return;
      }
      const range = sel.getRangeAt(0);
      const ce = closestContentEditable(range.startContainer);
      if (!ce || ce !== closestContentEditable(range.endContainer)) {
        setPos(null);
        rangeRef.current = null;
        return;
      }
      const rect = range.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) {
        setPos(null);
        rangeRef.current = null;
        return;
      }
      rangeRef.current = range.cloneRange();
      setPos({ x: rect.left + rect.width / 2, y: rect.top });
    }
    function onKey(e: KeyboardEvent) {
      // Only intercept when there's a live selection inside an editable.
      if (!rangeRef.current) return;
      if (!(e.metaKey || e.ctrlKey)) return;
      const k = e.key.toLowerCase();
      let mark: Mark | null = null;
      if (k === "b") mark = "bold";
      else if (k === "i") mark = "italic";
      else if (k === "e") mark = "code";
      else if (k === "k" && e.shiftKey) mark = "link";
      else if (k === "x" && e.shiftKey) mark = "strike";
      if (!mark) return;
      e.preventDefault();
      applyRef.current(mark);
    }
    document.addEventListener("selectionchange", update);
    document.addEventListener("scroll", update, true);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", update);
    return () => {
      document.removeEventListener("selectionchange", update);
      document.removeEventListener("scroll", update, true);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", update);
    };
  }, []);

  const apply = React.useCallback((mark: Mark) => {
    const range = rangeRef.current;
    if (!range) return;
    const ce = closestContentEditable(range.startContainer);
    if (!ce) return;
    const selected = range.toString();
    if (mark === "link") {
      const url = window.prompt("Link URL", "https://");
      if (!url) return;
      replaceRange(range, `[${selected || "link"}](${url})`, ce);
      return;
    }
    const [open, close] = WRAP[mark];
    replaceRange(range, `${open}${selected}${close}`, ce);
  }, []);
  applyRef.current = apply;

  const clearFormatting = React.useCallback(() => {
    const range = rangeRef.current;
    if (!range) return;
    const ce = closestContentEditable(range.startContainer);
    if (!ce) return;
    const selected = range.toString();
    if (!selected) return;
    replaceRange(range, stripMd(selected), ce);
  }, []);

  if (!pos) return null;

  return (
    <div
      role="toolbar"
      style={{
        position: "fixed",
        left: pos.x,
        top: Math.max(8, pos.y - 44),
        transform: "translateX(-50%)",
        zIndex: 50,
      }}
      className={cn(
        "flex items-center gap-0.5 rounded-md border border-border bg-popover/95 p-0.5 shadow-soft backdrop-blur",
      )}
      onMouseDown={(e) => e.preventDefault()}
    >
      <Btn label="Bold (Cmd/Ctrl+B)" onClick={() => apply("bold")}><Bold className="h-3.5 w-3.5" /></Btn>
      <Btn label="Italic (Cmd/Ctrl+I)" onClick={() => apply("italic")}><Italic className="h-3.5 w-3.5" /></Btn>
      <Btn label="Strike-through (Cmd/Ctrl+Shift+X)" onClick={() => apply("strike")}><Strikethrough className="h-3.5 w-3.5" /></Btn>
      <Btn label="Inline code (Cmd/Ctrl+E)" onClick={() => apply("code")}><Code className="h-3.5 w-3.5" /></Btn>
      <Btn label="Link (Cmd/Ctrl+Shift+K)" onClick={() => apply("link")}><Link2 className="h-3.5 w-3.5" /></Btn>
      <Btn label="Clear formatting" onClick={clearFormatting}><Eraser className="h-3.5 w-3.5" /></Btn>
    </div>
  );
}
