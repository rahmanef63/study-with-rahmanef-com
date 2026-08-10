"use client";

import type { KeyboardEvent } from "react";
import { Input } from "@/components/ui/input";

/**
 * Built-in minimal code block — the cluster's decoupled stand-in for
 * notion-page-clone's `@/slices/code-block` (hljs syntax highlighting). Keeps
 * the same render contract so a host can swap a richer highlighter in later
 * via the editor's component registry. Plain monospace contentEditable + a
 * language tag; no highlighting, no extra deps.
 */
export interface SimpleCodeBlockProps {
  text: string;
  lang?: string;
  registerRef?: (el: HTMLElement | null) => void;
  onText?: (next: string) => void;
  onLang?: (lang: string) => void;
  onKeyDown?: (e: KeyboardEvent<HTMLElement>) => void;
}

export function SimpleCodeBlock({
  text,
  lang,
  registerRef,
  onText,
  onLang,
  onKeyDown,
}: SimpleCodeBlockProps) {
  return (
    <div className="relative flex-1 rounded-md border bg-muted/40 font-mono text-sm">
      <Input
        value={lang ?? ""}
        onChange={(e) => onLang?.(e.target.value)}
        placeholder="lang"
        aria-label="Code language"
        className="absolute right-2 top-2 h-5 w-20 bg-background/60 px-1.5 text-[10px] text-muted-foreground"
      />
      <pre className="overflow-x-auto p-3 pr-24">
        <code
          ref={(el) => registerRef?.(el)}
          contentEditable
          suppressContentEditableWarning
          spellCheck={false}
          onInput={(e) => onText?.((e.currentTarget as HTMLElement).innerText)}
          onKeyDown={onKeyDown}
          className="block whitespace-pre-wrap break-words outline-none"
        >
          {text}
        </code>
      </pre>
    </div>
  );
}
