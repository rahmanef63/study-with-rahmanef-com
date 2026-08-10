"use client";

/** MentionTypeahead — inline `@` mention dropdown.
 *  Source: notion-page-clone editor/components/MentionTypeahead.tsx.
 *
 *  Seam mapping:
 *   - source filtered `useEditorAdapter().pages` locally → useEditorAdapter()
 *     .mention.search(query) (async MentionResult[]). When the host wires no
 *     MentionAdapter the typeahead never activates (renders null).
 *   - source @/shared/components/icon-picker DynamicIcon → @notion/shared/ui
 *     PageIcon (icon display only).
 *   - DOM helpers reused from mention-typeahead/{dom,insert}.
 *
 *  Scans backward from the caret on every input; on
 *  `[start-of-string|whitespace]@<word>` it opens a popover of matches.
 *  Selection inserts a markdown link `[Title](/dashboard/p/<id>)` so the share
 *  view renders it via inlineMd. */

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PageIcon } from "@notion/shared/ui/PageIcon";
import { useEditorAdapter } from "@notion/slices/editor/lib/adapterContext";
import type { MentionResult } from "@notion/slices/editor/lib/adapter";
import { walkBack } from "./mention-typeahead/dom";
import { insertMention, type State } from "./mention-typeahead/insert";

const MAX_RESULTS = 6;
const TRIGGER_RE = /(?:^|\s)@([\w-]{0,40})$/;

export function MentionTypeahead() {
  const { mention } = useEditorAdapter();
  const [state, setState] = React.useState<State | null>(null);
  const [matches, setMatches] = React.useState<MentionResult[]>([]);
  const [active, setActive] = React.useState(0);

  // Async search whenever the query changes (debounce-free; results are small).
  React.useEffect(() => {
    if (!mention || !state) {
      setMatches([]);
      return;
    }
    let cancelled = false;
    mention.search(state.query).then((res) => {
      if (!cancelled) setMatches(res.slice(0, MAX_RESULTS));
    });
    return () => {
      cancelled = true;
    };
  }, [mention, state]);

  React.useEffect(() => setActive(0), [state?.query]);

  React.useEffect(() => {
    // Mention adapter absent → never activate the typeahead.
    if (!mention) return;
    function onInput(e: Event) {
      const target = e.target as HTMLElement | null;
      if (!target || !target.isContentEditable) return;
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;
      const caret = sel.getRangeAt(0);
      if (!caret.collapsed) return;
      const probe = document.createRange();
      probe.selectNodeContents(target);
      probe.setEnd(caret.endContainer, caret.endOffset);
      const before = probe.toString();
      const m = TRIGGER_RE.exec(before);
      if (!m) {
        setState((s) => (s ? null : s));
        return;
      }
      const query = m[1];
      const start = walkBack(target, caret.endContainer, caret.endOffset, query.length + 1);
      if (!start) return;
      const range = document.createRange();
      range.setStart(start.node, start.offset);
      range.setEnd(caret.endContainer, caret.endOffset);
      const rect = range.getBoundingClientRect();
      setState({ ce: target, range, query, pos: { x: rect.left, y: rect.bottom + 4 } });
    }
    function onSelChange() {
      const sel = window.getSelection();
      if (!sel || !sel.isCollapsed) {
        setState((s) => (s ? null : s));
      }
    }
    document.addEventListener("input", onInput, true);
    document.addEventListener("selectionchange", onSelChange);
    return () => {
      document.removeEventListener("input", onInput, true);
      document.removeEventListener("selectionchange", onSelChange);
    };
  }, [mention]);

  const pick = React.useCallback((s: State, r: MentionResult) => {
    // The insert helper writes `[title](/dashboard/p/<id>)`; map label→title.
    insertMention(s, { id: r.id, title: r.label, icon: r.icon ?? "" });
    setState(null);
  }, []);

  React.useEffect(() => {
    if (!state) return;
    function onKey(e: KeyboardEvent) {
      if (!state) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActive((i) => Math.min(i + 1, matches.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" || e.key === "Tab") {
        if (matches.length === 0) return;
        e.preventDefault();
        pick(state, matches[active]);
      } else if (e.key === "Escape") {
        e.preventDefault();
        setState(null);
      }
    }
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [state, matches, active, pick]);

  if (!mention || !state || matches.length === 0) return null;

  return (
    <div
      role="listbox"
      style={{ position: "fixed", left: state.pos.x, top: state.pos.y, zIndex: 50 }}
      className="w-64 overflow-hidden rounded-md border border-border bg-popover/95 shadow-soft backdrop-blur"
      onMouseDown={(e) => e.preventDefault()}
    >
      {matches.map((r, i) => (
        <Button
          key={r.id}
          type="button"
          variant="ghost"
          role="option"
          aria-selected={i === active}
          onClick={() => pick(state, r)}
          onMouseEnter={() => setActive(i)}
          className={cn(
            "flex h-auto w-full items-center justify-start gap-2 rounded-none px-2.5 py-1.5 text-left text-xs font-normal",
            i === active ? "bg-accent" : "hover:bg-accent",
          )}
        >
          <PageIcon value={r.icon} className="text-sm" />
          <span className="flex-1 truncate">{r.label || "Untitled"}</span>
        </Button>
      ))}
    </div>
  );
}
