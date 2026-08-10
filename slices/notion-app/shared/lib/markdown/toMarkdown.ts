/** blocksToMarkdown — serialise a notion block tree to a markdown string.
 *
 *  The wire format that lets notion content be read by any markdown surface
 *  (e.g. the `markdown` slice). Inline formatting already lives in
 *  `block.text` as markdown markers (`**b**`, `_i_`, `~~s~~`, `` `c` ``,
 *  `[l](u)`, `$x$`) so inline round-trips for free — only block-level
 *  structure is mapped here. Structural-only blocks with no textual content
 *  (page link, database, button, synced, toc) are dropped. Pure / no React.
 *
 *  Grammar mirrors `fromMarkdown.markdownToBlocks` and the markdown-slice parser:
 *    headings  #..######          callouts  > [!NOTE] (GitHub alert)
 *    bullet    -                  toggle    <details><summary>…</summary>
 *    numbered  1.                 image     ![caption](url)
 *    todo      - [ ] / - [x]      embed/av  [caption](url)
 *    quote     >                  equation  $$ … $$
 *    code      ```lang            table     | a | b |
 *    divider   ---                columns   flattened (content preserved) */

import type { Block } from "../../types/blocks";

const ALERT: Record<string, string> = {
  note: "NOTE", tip: "TIP", warning: "WARNING",
  important: "IMPORTANT", caution: "CAUTION", default: "NOTE",
};

const pad = (indent = 0) => "  ".repeat(Math.max(0, indent));
const quote = (text: string) => (text || "").split("\n").map((l) => `> ${l}`).join("\n");

export function blocksToMarkdown(blocks: Block[]): string {
  const chunks = blocks.map(blockToMd).filter((s): s is string => s !== null);
  return chunks.join("\n\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
}

function blockToMd(b: Block): string | null {
  switch (b.type) {
    case "paragraph": return b.text || "";
    case "h1": return `# ${b.text}`;
    case "h2": return `## ${b.text}`;
    case "h3": return `### ${b.text}`;
    case "h4": return `#### ${b.text}`;
    case "h5": return `##### ${b.text}`;
    case "h6": return `###### ${b.text}`;
    case "bullet": return `${pad(b.indent)}- ${b.text}`;
    case "numbered": return `${pad(b.indent)}1. ${b.text}`;
    case "todo": return `${pad(b.indent)}- [${b.checked ? "x" : " "}] ${b.text}`;
    case "quote": return quote(b.text);
    case "code": return "```" + (b.lang ?? "") + "\n" + (b.text ?? "") + "\n```";
    case "divider": return "---";
    case "equation": return "$$\n" + (b.text ?? "") + "\n$$";
    case "callout":
      return `> [!${ALERT[b.calloutKind ?? "default"] ?? "NOTE"}]\n${quote(b.text)}`;
    case "image":
      return b.url ? `![${b.caption ?? ""}](${b.url})` : (b.caption || null);
    case "embed": case "video": case "audio":
      return b.url ? `[${b.caption || b.url}](${b.url})` : (b.caption || null);
    case "toggle": {
      const inner = b.children?.length
        ? "\n\n" + blocksToMarkdown(b.children).trim() + "\n"
        : "";
      return `<details><summary>${b.text}</summary>${inner}\n</details>`;
    }
    case "columns2": case "columns3": case "columns4": case "columns5":
      return (b.columns ?? [])
        .map((col) => blocksToMarkdown(col).trim())
        .filter(Boolean)
        .join("\n\n") || null;
    case "table": return tableToMd(b);
    // structural-only blocks carry no markdown representation
    case "page": case "database": case "button": case "synced": case "toc":
    default:
      return b.text ? b.text : null;
  }
}

function tableToMd(b: Block): string | null {
  const rows = b.tableRows ?? [];
  if (!rows.length || !rows[0]?.length) return null;
  const align = b.tableAlign ?? [];
  const sep = (i: number) => {
    const a = align[i];
    return a === "center" ? ":---:" : a === "right" ? "---:" : a === "left" ? ":---" : "---";
  };
  const cells = (r: string[]) => `| ${r.map((c) => (c ?? "").replace(/\|/g, "\\|")).join(" | ")} |`;
  const head = rows[0]!;
  return [
    cells(head),
    `| ${head.map((_, i) => sep(i)).join(" | ")} |`,
    ...rows.slice(1).map(cells),
  ].join("\n");
}
