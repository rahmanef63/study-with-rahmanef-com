/** Markdown → MdNode parser for the markdown slice.
 *
 *  Lean block model. Line-based scanner; inline markers are left verbatim in
 *  `text` and resolved at render time by `renderInline`. Grammar matches the
 *  notion ⇄ markdown bridge (`@notion/shared/lib/markdown`) so notion-exported
 *  content renders here identically — that is the sync contract. Fenced
 *  ```mermaid and ```chart blocks get dedicated diagram/chart nodes.
 *  Pure / no React. */

export type Align = "left" | "center" | "right";

export type MdNode =
  | { type: "heading"; level: 1 | 2 | 3 | 4 | 5 | 6; text: string }
  | { type: "paragraph"; text: string }
  | { type: "bullet"; text: string; indent: number }
  | { type: "numbered"; text: string; indent: number }
  | { type: "todo"; text: string; checked: boolean; indent: number }
  | { type: "quote"; text: string }
  | { type: "callout"; text: string; kind: string }
  | { type: "code"; text: string; lang?: string }
  | { type: "diagram"; text: string }
  | { type: "chart"; text: string }
  | { type: "equation"; text: string }
  | { type: "divider" }
  | { type: "image"; url: string; caption?: string }
  | { type: "table"; rows: string[][]; align: Align[] }
  | { type: "toggle"; text: string; children: MdNode[] };

const TABLE_ROW = /^\s*\|(.+)\|\s*$/;
const TABLE_SEP = /^\s*\|?[\s:|-]+\|?\s*$/;

export function parseMarkdown(md: string): MdNode[] {
  const lines = (md ?? "").replace(/\r\n/g, "\n").split("\n");
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

    const fence = t.match(/^```(\w*)\s*$/);
    if (fence) {
      flush();
      const body: string[] = [];
      i++;
      while (i < lines.length && !lines[i]!.trim().startsWith("```")) body.push(lines[i++]!);
      i++;
      const lang = fence[1] || undefined;
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

    const det = t.match(/^<details>\s*<summary>(.*?)<\/summary>/i);
    if (det) {
      flush();
      const body: string[] = [];
      i++;
      while (i < lines.length && !/<\/details>/i.test(lines[i]!)) body.push(lines[i++]!);
      i++;
      nodes.push({ type: "toggle", text: det[1] ?? "", children: parseMarkdown(body.join("\n")) });
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

    if (TABLE_ROW.test(line) && i + 1 < lines.length && TABLE_SEP.test(lines[i + 1]!) && lines[i + 1]!.includes("-")) {
      flush();
      const rows: string[][] = [splitRow(line)];
      const align = parseAlign(lines[i + 1]!);
      i += 2;
      while (i < lines.length && TABLE_ROW.test(lines[i]!)) rows.push(splitRow(lines[i++]!));
      nodes.push({ type: "table", rows, align });
      continue;
    }

    flush();

    if (/^(-{3,}|\*{3,}|_{3,})$/.test(t)) { nodes.push({ type: "divider" }); i++; continue; }

    const h = t.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      nodes.push({ type: "heading", level: h[1]!.length as 1 | 2 | 3 | 4 | 5 | 6, text: h[2]!.trim() });
      i++; continue;
    }

    if (t.startsWith(">")) {
      const body: string[] = [];
      while (i < lines.length && lines[i]!.trim().startsWith(">")) body.push(lines[i++]!.replace(/^\s*>\s?/, ""));
      nodes.push({ type: "quote", text: body.join("\n").trim() });
      continue;
    }

    const indent = Math.floor((line.length - line.trimStart().length) / 2);

    const todo = t.match(/^[-*+]\s+\[([ xX])\]\s+(.*)$/);
    if (todo) { nodes.push({ type: "todo", text: todo[2]!, checked: todo[1]!.toLowerCase() === "x", indent }); i++; continue; }

    const bullet = t.match(/^[-*+]\s+(.*)$/);
    if (bullet) { nodes.push({ type: "bullet", text: bullet[1]!, indent }); i++; continue; }

    const num = t.match(/^\d+[.)]\s+(.*)$/);
    if (num) { nodes.push({ type: "numbered", text: num[1]!, indent }); i++; continue; }

    const img = t.match(/^!\[(.*?)\]\((\S+?)\)$/);
    if (img) { nodes.push({ type: "image", url: img[2]!, caption: img[1] || undefined }); i++; continue; }

    para.push(line);
    i++;
  }
  flush();
  return nodes;
}

function splitRow(line: string): string[] {
  return line.trim().replace(/^\||\|$/g, "").split(/(?<!\\)\|/).map((c) => c.replace(/\\\|/g, "|").trim());
}

function parseAlign(sep: string): Align[] {
  return splitRow(sep).map((c) => {
    const l = c.startsWith(":"), r = c.endsWith(":");
    return l && r ? "center" : r ? "right" : "left";
  });
}
