/** Render a Database (schema + rows) as an inline table for MD/HTML
 *  exports. Vendored from notion-page-clone `shared/lib/databaseTable.ts`;
 *  `valueToCell` now comes from the trimmed `./csvCells` (not the full csv
 *  module). Used by `blockToHtml` when a `database` block fires, so embedded
 *  databases come through as real data (not a dead `[Database: name]` link).
 *  Types via `@notion/shared/types`. Pure / no React. */

import type { Database, Page, PropertyValue } from "../types";
import { valueToCell } from "./csvCells";

function escMdCell(s: string): string {
  return s.replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
}

/** GFM table — Notion's MD importer turns this into a simple table block. */
export function databaseToMarkdownTable(
  db: Database,
  rows: Page[],
  allPages?: Page[],
): string {
  const live = rows.filter((r) => !r.trashed);
  const headers = ["Title", ...db.properties.map((p) => p.name)];
  const sep = headers.map(() => "---");
  const lines = [
    `| ${headers.map(escMdCell).join(" | ")} |`,
    `| ${sep.join(" | ")} |`,
  ];
  for (const row of live) {
    const cells = [
      escMdCell(row.title || ""),
      ...db.properties.map((p) =>
        escMdCell(valueToCell(p, (row.rowProps?.[p.id] ?? null) as PropertyValue, allPages)),
      ),
    ];
    lines.push(`| ${cells.join(" | ")} |`);
  }
  return lines.join("\n");
}

function escHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function databaseToHtmlTable(db: Database, rows: Page[], allPages?: Page[]): string {
  const live = rows.filter((r) => !r.trashed);
  const headers = ["Title", ...db.properties.map((p) => p.name)]
    .map((h) => `<th>${escHtml(h)}</th>`).join("");
  const body = live.map((row) => {
    const cells = [row.title || "", ...db.properties.map((p) => valueToCell(p, (row.rowProps?.[p.id] ?? null) as PropertyValue, allPages))]
      .map((c) => `<td>${escHtml(c)}</td>`).join("");
    return `<tr>${cells}</tr>`;
  }).join("");
  return `<table><thead><tr>${headers}</tr></thead><tbody>${body}</tbody></table>`;
}
