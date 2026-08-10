/** Single-page export helpers for usePageActions. Replaces the source's
 *  `@/shared/lib/markdown` page-level exports (`pageToMarkdown`,
 *  `pageToPlainText`, `downloadFile`, `pickFile`) which the vendored
 *  `@notion/shared/lib/markdown` (block-level only) doesn't carry.
 *  Markdown export = title + `blocksToMarkdown(page.blocks)`. Pure helpers
 *  + browser Blob download / programmatic file pick (no JSX file input). */

import type { Page } from "@notion/shared/types";
import type { ExportContext } from "@notion/shared/lib/exportContext";
import { blocksToMarkdown } from "@notion/shared/lib/markdown";

/** Serialise a page (heading + blocks) to a markdown string. `ctx` is
 *  accepted for signature parity with the source but the vendored
 *  block-level serialiser doesn't thread it (database blocks drop). */
export function pageToMarkdown(page: Page, _ctx?: ExportContext): string {
  void _ctx;
  const title = `# ${page.title || "Untitled"}\n\n`;
  return title + blocksToMarkdown(page.blocks);
}

/** Flatten a page to plain text — block text joined by blank lines,
 *  toggle/column children walked depth-first. */
export function pageToPlainText(page: Page): string {
  const walk = (blocks: Page["blocks"]): string[] =>
    blocks.flatMap((b) => {
      const lines = b.text ? [b.text] : [];
      if (b.children?.length) lines.push(...walk(b.children));
      if (b.columns?.length) for (const col of b.columns) lines.push(...walk(col));
      return lines;
    });
  const body = walk(page.blocks).join("\n\n");
  return `${page.title || "Untitled"}\n\n${body}`.trim() + "\n";
}

/** Trigger a browser download of arbitrary text content. */
export function downloadFile(filename: string, content: string, mime = "text/markdown"): void {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Programmatic file picker (no JSX file input). Resolves with the chosen
 *  File or null if the dialog is dismissed. */
export function pickFile(accept: string): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;
    input.onchange = () => resolve(input.files?.[0] ?? null);
    // Some browsers never fire change on cancel — best-effort, no leak.
    input.click();
  });
}
