import type { Align } from "./parse";
/** Escaped and code-span pipes do not delimit cells. */
export function splitTableRow(line: string): string[] {
  const text = line.trim().replace(/^\|/, "").replace(/(?<!\\)\|$/, "");
  const cells: string[] = [];
  let cell = "";
  let ticks = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === "\\" && text[i + 1] === "|") { cell += "|"; i++; continue; }
    if (text[i] === "`") {
      const run = text.slice(i).match(/^`+/)![0];
      if (!ticks) ticks = run.length;
      else if (ticks === run.length) ticks = 0;
      cell += run; i += run.length - 1; continue;
    }
    if (text[i] === "|" && !ticks) { cells.push(cell.trim()); cell = ""; }
    else cell += text[i];
  }
  cells.push(cell.trim());
  return cells;
}
export function tableAlignment(line: string): Align[] | null {
  const cells = splitTableRow(line);
  if (cells.length < 1 || cells.some((cell) => !/^:?-{3,}:?$/.test(cell))) return null;
  return cells.map((cell) => cell.startsWith(":") && cell.endsWith(":") ? "center" : cell.endsWith(":") ? "right" : "left");
}
