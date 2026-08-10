/** markdownToBlocks — parse a markdown string into a notion block tree.
 *
 *  Inverse of `blocksToMarkdown`. Line-based scanner; inline markers are left
 *  verbatim in `block.text` (they are already the editor's source of truth).
 *  Pure / no React. Same grammar as the markdown-slice parser. */

import type { Block, BlockType } from "../../types/blocks";
import { uid } from "../uid";

const ALERT_TO_KIND: Record<string, Block["calloutKind"]> = {
  NOTE: "note", TIP: "tip", WARNING: "warning",
  IMPORTANT: "important", CAUTION: "caution",
};

const mk = (type: BlockType, text: string, extra: Partial<Block> = {}): Block => ({
  id: uid(), type, text, ...extra,
});

const TABLE_ROW = /^\s*\|(.+)\|\s*$/;
const TABLE_SEP = /^\s*\|?[\s:|-]+\|?\s*$/;

export function markdownToBlocks(md: string): Block[] {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let i = 0;
  let para: string[] = [];

  const flushPara = () => {
    if (para.length) { blocks.push(mk("paragraph", para.join("\n").trim())); para = []; }
  };

  while (i < lines.length) {
    const line = lines[i]!;
    const trimmed = line.trim();

    if (!trimmed) { flushPara(); i++; continue; }

    // fenced code
    const fence = trimmed.match(/^```(\w*)\s*$/);
    if (fence) {
      flushPara();
      const lang = fence[1] || undefined;
      const body: string[] = [];
      i++;
      while (i < lines.length && !lines[i]!.trim().startsWith("```")) body.push(lines[i++]!);
      i++; // closing fence
      blocks.push(mk("code", body.join("\n"), { lang }));
      continue;
    }

    // block equation
    if (trimmed === "$$") {
      flushPara();
      const body: string[] = [];
      i++;
      while (i < lines.length && lines[i]!.trim() !== "$$") body.push(lines[i++]!);
      i++;
      blocks.push(mk("equation", body.join("\n")));
      continue;
    }

    // <details> toggle
    const det = trimmed.match(/^<details>\s*<summary>(.*?)<\/summary>/i);
    if (det) {
      flushPara();
      const summary = det[1] ?? "";
      const body: string[] = [];
      i++;
      while (i < lines.length && !/<\/details>/i.test(lines[i]!)) body.push(lines[i++]!);
      i++;
      blocks.push(mk("toggle", summary, { children: markdownToBlocks(body.join("\n")), collapsed: true }));
      continue;
    }

    // GitHub-style callout `> [!NOTE]`
    const alert = trimmed.match(/^>\s*\[!(\w+)\]\s*$/i);
    if (alert) {
      flushPara();
      const kind = ALERT_TO_KIND[alert[1]!.toUpperCase()] ?? "default";
      const body: string[] = [];
      i++;
      while (i < lines.length && lines[i]!.trim().startsWith(">")) {
        body.push(lines[i++]!.replace(/^\s*>\s?/, ""));
      }
      blocks.push(mk("callout", body.join("\n").trim(), { calloutKind: kind }));
      continue;
    }

    // table
    if (TABLE_ROW.test(line) && i + 1 < lines.length && TABLE_SEP.test(lines[i + 1]!) && lines[i + 1]!.includes("-")) {
      flushPara();
      const rows: string[][] = [splitRow(line)];
      const align = parseAlign(lines[i + 1]!);
      i += 2;
      while (i < lines.length && TABLE_ROW.test(lines[i]!)) rows.push(splitRow(lines[i++]!));
      blocks.push(mk("table", "", { tableRows: rows, tableHeader: true, tableAlign: align }));
      continue;
    }

    // single-line constructs
    flushPara();

    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) { blocks.push(mk("divider", "")); i++; continue; }

    const heading = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      const lvl = heading[1]!.length as 1 | 2 | 3 | 4 | 5 | 6;
      blocks.push(mk(`h${lvl}` as BlockType, heading[2]!.trim()));
      i++; continue;
    }

    if (trimmed.startsWith(">")) {
      const body: string[] = [];
      while (i < lines.length && lines[i]!.trim().startsWith(">")) {
        body.push(lines[i++]!.replace(/^\s*>\s?/, ""));
      }
      blocks.push(mk("quote", body.join("\n").trim()));
      continue;
    }

    const indent = Math.floor((line.length - line.trimStart().length) / 2);

    const todo = trimmed.match(/^[-*+]\s+\[([ xX])\]\s+(.*)$/);
    if (todo) {
      blocks.push(mk("todo", todo[2]!, { checked: todo[1]!.toLowerCase() === "x", indent }));
      i++; continue;
    }

    const bullet = trimmed.match(/^[-*+]\s+(.*)$/);
    if (bullet) { blocks.push(mk("bullet", bullet[1]!, { indent })); i++; continue; }

    const numbered = trimmed.match(/^\d+[.)]\s+(.*)$/);
    if (numbered) { blocks.push(mk("numbered", numbered[1]!, { indent })); i++; continue; }

    const img = trimmed.match(/^!\[(.*?)\]\((\S+?)\)$/);
    if (img) { blocks.push(mk("image", "", { url: img[2], caption: img[1] || undefined })); i++; continue; }

    // plain text — accumulate into a paragraph
    para.push(line);
    i++;
  }
  flushPara();
  return blocks;
}

function splitRow(line: string): string[] {
  return line.trim().replace(/^\||\|$/g, "").split(/(?<!\\)\|/).map((c) => c.replace(/\\\|/g, "|").trim());
}

function parseAlign(sep: string): ("left" | "center" | "right")[] {
  return splitRow(sep).map((c) => {
    const l = c.startsWith(":"), r = c.endsWith(":");
    return l && r ? "center" : r ? "right" : l ? "left" : "left";
  });
}
