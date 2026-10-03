/** Markdown → MdNode parser for the markdown slice.
 *
 *  Lean block model. Line-based scanner; inline markers are left verbatim in
 *  `text` and resolved at render time by `renderInline`. Grammar extends the
 *  notion ⇄ markdown bridge (`@notion/shared/lib/markdown`) while preserving notion-exported
 *  block types. Fenced
 *  ```mermaid and ```chart blocks get dedicated diagram/chart nodes.
 *  Pure / no React. */

import { safeMarkdownUrl, youtubeFromLine } from "./media";
import { splitTableRow, tableAlignment } from "./table";

export type Align = "left" | "center" | "right";

export type MdNode =
  | { type: "heading"; level: 1 | 2 | 3 | 4 | 5 | 6; text: string }
  | { type: "paragraph"; text: string }
  | { type: "bullet"; text: string; indent: number }
  | { type: "numbered"; text: string; indent: number; start?: number }
  | { type: "todo"; text: string; checked: boolean; indent: number }
  | { type: "quote"; text: string }
  | { type: "callout"; text: string; kind: string }
  | { type: "code"; text: string; lang?: string }
  | { type: "diagram"; text: string }
  | { type: "chart"; text: string }
  | { type: "equation"; text: string }
  | { type: "divider" }
  | { type: "image"; url: string; caption?: string }
  | { type: "youtube"; videoId: string; startSeconds?: number; title?: string }
  | { type: "table"; rows: string[][]; align: Align[] }
  | { type: "toggle"; text: string; children: MdNode[] };

const TABLE_ROW = (line: string) => line.includes("|");

export function parseMarkdown(md: string, depth = 0): MdNode[] {
  if (depth >= 24) return [{ type: "paragraph", text: md }];
  const lines = (md ?? "").replace(/\r\n?/g, "\n").split("\n");
  const nodes: MdNode[] = [];
  let i = 0;
  let para: string[] = [];
  const flush = () => {
    if (para.length) { nodes.push({ type: "paragraph", text: para.join("\n").trim() }); para = []; }
  };

  while (i < lines.length) {
    const line = lines[i]!;
    const t = line.trim();
    if (!t) { flush(); i++; continue; }

    const fence = t.match(/^(`{3,}|~{3,})[ \t]*([^\s`~]*)[^\n]*$/);
    if (fence) {
      flush();
      const body: string[] = [];
      i++;
      const closing = new RegExp(`^${fence[1][0]}{${fence[1].length},}\\s*$`);
      while (i < lines.length && !closing.test(lines[i]!.trim())) body.push(lines[i++]!);
      if (i < lines.length) i++;
      const lang = fence[2] || undefined;
      // dedicated rich views for diagram + chart fences
      if (lang === "mermaid") nodes.push({ type: "diagram", text: body.join("\n") });
      else if (lang === "chart") nodes.push({ type: "chart", text: body.join("\n") });
      else nodes.push({ type: "code", text: body.join("\n"), lang });
      continue;
    }

    if (t === "$$") {
      flush();
      const body: string[] = [];
      i++;
      while (i < lines.length && lines[i]!.trim() !== "$$") body.push(lines[i++]!);
      i++;
      nodes.push({ type: "equation", text: body.join("\n") });
      continue;
    }

    const splitDetails = t === "<details>" && /^\s*<summary>.*<\/summary>\s*$/i.test(lines[i + 1] ?? "");
    const detailsHead = splitDetails ? `${t}${lines[i + 1]!.trim()}` : t;
    const det = detailsHead.match(/^<details>\s*<summary>(.*?)<\/summary>(.*)$/i);
    if (det) {
      flush();
      const body: string[] = [];
      i += splitDetails ? 2 : 1;
      if (/<\/details>\s*$/i.test(det[2])) {
        nodes.push({ type: "toggle", text: det[1], children: parseMarkdown(det[2].replace(/<\/details>\s*$/i, ""), depth + 1) });
        continue;
      }
      if (det[2].trim()) body.push(det[2]);
      let nesting = 1;
      while (i < lines.length) {
        const current = lines[i++]!;
        nesting += (current.match(/<details>/gi) ?? []).length - (current.match(/<\/details>/gi) ?? []).length;
        if (nesting <= 0) break;
        body.push(current);
      }
      nodes.push({ type: "toggle", text: det[1] ?? "", children: parseMarkdown(body.join("\n"), depth + 1) });
      continue;
    }

    const alert = t.match(/^>\s*\[!(\w+)\]\s*$/i);
    if (alert) {
      flush();
      const body: string[] = [];
      i++;
      while (i < lines.length && lines[i]!.trim().startsWith(">")) body.push(lines[i++]!.replace(/^\s*>\s?/, ""));
      nodes.push({ type: "callout", kind: alert[1]!.toLowerCase(), text: body.join("\n").trim() });
      continue;
    }

    const align = i + 1 < lines.length && TABLE_ROW(line) ? tableAlignment(lines[i + 1]!) : null;
    if (align) {
      flush();
      const rows: string[][] = [splitTableRow(line)];
      i += 2;
      while (i < lines.length && TABLE_ROW(lines[i]!) && lines[i]!.trim()) rows.push(splitTableRow(lines[i++]!));
      nodes.push({ type: "table", rows, align });
      continue;
    }

    const youtube = youtubeFromLine(t);
    if (youtube) { flush(); nodes.push({ type: "youtube", ...youtube }); i++; continue; }

    const directive = t.match(/^:::(details|callout)(?:\s+(.*))?$/);
    if (directive) {
      flush(); const body: string[] = []; let nesting = 1; i++;
      while (i < lines.length) {
        const current = lines[i++]!;
        if (/^:::(?:details|callout)(?:\s|$)/.test(current.trim())) nesting++;
        else if (current.trim() === ":::") nesting--;
        if (nesting <= 0) break;
        body.push(current);
      }
      if (directive[1] === "details") nodes.push({ type: "toggle", text: directive[2] || "Details", children: parseMarkdown(body.join("\n"), depth + 1) });
      else nodes.push({ type: "callout", kind: directive[2] || "note", text: body.join("\n") });
      continue;
    }

    if (/^(-{3,}|\*{3,}|_{3,})$/.test(t)) { flush(); nodes.push({ type: "divider" }); i++; continue; }

    const h = t.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      flush(); nodes.push({ type: "heading", level: h[1]!.length as 1 | 2 | 3 | 4 | 5 | 6, text: h[2]!.trim() });
      i++; continue;
    }

    if (t.startsWith(">")) {
      flush(); const body: string[] = [];
      while (i < lines.length && lines[i]!.trim().startsWith(">")) body.push(lines[i++]!.replace(/^\s*>\s?/, ""));
      nodes.push({ type: "quote", text: body.join("\n").trim() });
      continue;
    }

    const indent = Math.min(24, Math.floor((line.match(/^\s*/)?.[0].replace(/\t/g, "    ").length ?? 0) / 2));

    const todo = t.match(/^[-*+]\s+\[([ xX])\]\s+(.*)$/);
    if (todo) { flush(); nodes.push({ type: "todo", text: todo[2]!, checked: todo[1]!.toLowerCase() === "x", indent }); i++; continue; }

    const bullet = t.match(/^[-*+]\s+(.*)$/);
    if (bullet) { flush(); nodes.push({ type: "bullet", text: bullet[1]!, indent }); i++; continue; }

    const num = t.match(/^(\d+)[.)]\s+(.*)$/);
    if (num) { flush(); nodes.push({ type: "numbered", text: num[2]!, indent, start: Number(num[1]) }); i++; continue; }

    const img = t.match(/^!\[(.*?)\]\((\S+?)\)$/);
    if (img && safeMarkdownUrl(img[2]!, true)) { flush(); nodes.push({ type: "image", url: img[2]!, caption: img[1] || undefined }); i++; continue; }

    para.push(line);
    i++;
  }
  flush();
  return nodes;
}
