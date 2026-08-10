/** Page-level action hook (font, width, lock, copy, export, trash) for the
 *  PageActionsMenu. Ported from notion-page-clone
 *  `slices/editor/page-actions/usePageActions.ts`.
 *
 *  SEAM MAPPING:
 *  - data CRUD via `useEditorData()` (was `useEditorAdapter()` shim).
 *  - navigation via `useEditorAdapter().page?.navigateToPage?.` (was
 *    `@/shared/lib/router` useNavigate; guarded — host may not wire it).
 *  - export ctx built with `[]` databases — `useEditorData` carries no
 *    database list, so embedded-database blocks export as stub links until
 *    a host threads them (SEAM GAP, see final notes).
 *  - workspace-io JSON/ZIP actions (source `@/slices/workspace-io`) are NOT
 *    portable; kept as toast-info stubs so DataSubmenu still typechecks.
 *  - page-level markdown/plain-text/download/pick helpers come from the
 *    sibling `./pageExport` (the vendored markdown module is block-level only). */

import { useEffect } from "react";
import { useEditorData, useEditorAdapter } from "@notion/slices/editor/lib/adapterContext";
import type { Page, PageFont } from "@notion/shared/types";
import { toast } from "sonner";
import { markdownToBlocks } from "@notion/shared/lib/markdown";
import { pageToHtml, pageToHtmlFragment } from "@notion/shared/lib/html";
import { buildExportContext } from "@notion/shared/lib/exportContext";
import { pageToMarkdown, pageToPlainText, downloadFile, pickFile } from "./pageExport";

export function usePageActions(page: Page, close: () => void) {
  const { updatePage, duplicatePage, deletePage, addBlock, pages } = useEditorData();
  const navigateToPage = useEditorAdapter().page?.navigateToPage;
  const exportCtx = buildExportContext([], pages);

  const setFont = (font: PageFont) => updatePage(page.id, { font });
  const toggleSmall = () => updatePage(page.id, { smallText: !page.smallText });
  const toggleFull = () => updatePage(page.id, { fullWidth: !page.fullWidth });
  const toggleLock = () => {
    updatePage(page.id, { locked: !page.locked });
    toast.success(page.locked ? "Page unlocked" : "Page locked");
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied");
    } catch {
      toast.error("Failed to copy link");
    }
    close();
  };

  /** Multi-format clipboard. Writes text/plain + text/html via ClipboardItem
   *  so paste targets pick the richest representation they support. */
  const copyContents = async () => {
    const plain = pageToPlainText(page);
    const html = pageToHtmlFragment(page, exportCtx);
    try {
      if (typeof window !== "undefined" && "ClipboardItem" in window) {
        const item = new ClipboardItem({
          "text/plain": new Blob([plain], { type: "text/plain" }),
          "text/html": new Blob([html], { type: "text/html" }),
        });
        await navigator.clipboard.write([item]);
      } else {
        await navigator.clipboard.writeText(plain);
      }
      toast.success("Page contents copied (plain + HTML for Notion paste)");
    } catch {
      toast.error("Failed to copy contents");
    }
    close();
  };

  const onDuplicate = async () => {
    close();
    const c = await duplicatePage(page.id);
    if (c) navigateToPage?.(c.id);
  };

  const onTrash = () => {
    close();
    deletePage(page.id);
    navigateToPage?.("");
    toast.success("Moved to trash");
  };

  const safeTitle = (page.title || "untitled").replace(/[^a-z0-9-_ ]/gi, "_").trim() || "untitled";

  const onExportMd = () => {
    downloadFile(`${safeTitle}.md`, pageToMarkdown(page, exportCtx));
    toast.success("Exported as Markdown");
    close();
  };

  const onExportHtml = () => {
    downloadFile(`${safeTitle}.html`, pageToHtml(page, true, exportCtx), "text/html");
    toast.success("Exported as HTML");
    close();
  };

  const onExportTxt = () => {
    downloadFile(`${safeTitle}.txt`, pageToPlainText(page), "text/plain");
    toast.success("Exported as plain text");
    close();
  };

  const onImportMd = async () => {
    close();
    const file = await pickFile(".md,.markdown,text/markdown,text/plain");
    if (!file) return;
    const text = await file.text();
    const blocks = markdownToBlocks(text);
    for (const b of blocks) {
      await addBlock(page.id, page.blocks.length, b.type, {
        text: b.text,
        checked: b.checked,
        lang: b.lang,
      });
    }
    toast.success(`Imported ${blocks.length} blocks`);
  };

  /** Workspace-level JSON/ZIP I/O lived in `@/slices/workspace-io` (not
   *  portable to the decoupled cluster). Degrade to an info toast so the
   *  DataSubmenu rows stay wired without dragging the slice in. */
  const onExportJson = () => { toast.info("Workspace JSON export — host integration required"); close(); };
  const onImportJson = () => { toast.info("Workspace JSON import — host integration required"); close(); };
  const onImportZip = () => { toast.info("Workspace ZIP import — host integration required"); close(); };

  /** Browser-native PDF export — print stylesheet hides chrome, user picks
   *  "Save as PDF". Zero dep, works in every browser. */
  const onExportPdf = () => {
    close();
    setTimeout(() => window.print(), 50);
  };

  const stub = (label: string) => () => {
    toast.info(`${label} — coming soon`);
    close();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.altKey && e.key.toLowerCase() === "l") {
        e.preventDefault();
        copyLink();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page.id]);

  return {
    setFont, toggleSmall, toggleFull, toggleLock,
    copyLink, copyContents, onDuplicate, onTrash,
    onExportMd, onImportMd, onExportJson, onImportJson, onImportZip,
    onExportPdf, onExportHtml, onExportTxt,
    stub,
  };
}
