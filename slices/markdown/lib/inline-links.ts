import { safeMarkdownUrl } from "./media";
export function markdownLinkAt(text: string, start: number): { length: number; label: string; href: string } | null {
  if (text[start] !== "[") return null;
  let depth = 1;
  let end = start + 1;
  for (; end < text.length; end++) {
    if (text[end] === "\\") { end++; continue; }
    if (text[end] === "[") depth++;
    if (text[end] === "]" && --depth === 0) break;
  }
  // Only closing brackets reduce depth; nested link labels may contain formatting.
  if (depth || text[end + 1] !== "(") return null;
  const label = text.slice(start + 1, end);
  let close = end + 2;
  depth = 1;
  for (; close < text.length; close++) {
    if (text[close] === "\\") { close++; continue; }
    if (text[close] === "(") depth++;
    if (text[close] === ")" && --depth === 0) break;
  }
  if (depth) return null;
  const raw = text.slice(end + 2, close).trim();
  const target = raw.match(/^(?:<([^>]+)>|(\S+?))(?:\s+["'][^"']*["'])?$/);
  const href = target && safeMarkdownUrl(target[1] ?? target[2]);
  return href ? { length: close - start + 1, label, href } : null;
}

export function trimBareUrl(value: string): string {
  let text = value.replace(/[.,;:!?]+$/, "");
  while (text.endsWith(")") && (text.match(/\)/g) ?? []).length > (text.match(/\(/g) ?? []).length) text = text.slice(0, -1);
  return text;
}
