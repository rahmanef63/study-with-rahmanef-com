// posts slice — markdown → plain-text excerpt for feed cards and <meta
// description>. Pure and dependency-free: the feed renders hundreds of these,
// and running the full parser per card just to throw the AST away would be
// waste. Strips the safe-subset syntax the courses parser understands, nothing
// more — anything it misses degrades to visible punctuation, never to markup
// (the string is rendered as TEXT, so there is no injection surface either).
import { EXCERPT_CHARS } from "../config/limits";

const RULES: readonly [RegExp, string][] = [
  [/```[\s\S]*?```/g, " "], // fenced code
  [/`([^`]*)`/g, "$1"], // inline code
  [/!\[[^\]]*\]\([^)]*\)/g, " "], // images
  [/\[([^\]]*)\]\([^)]*\)/g, "$1"], // links → their text
  [/^\s{0,3}#{1,6}\s+/gm, ""], // headings
  [/^\s{0,3}>\s?/gm, ""], // quotes
  [/^\s{0,3}(?:[-*+]|\d+\.)\s+/gm, ""], // list bullets
  [/(\*\*|__|\*|_)/g, ""], // emphasis marks
];

/** Collapse markdown to one line of readable text. */
export function toPlainText(markdown: string): string {
  let text = markdown;
  for (const [pattern, replacement] of RULES) text = text.replace(pattern, replacement);
  return text.replace(/\s+/g, " ").trim();
}

/**
 * One-line excerpt, cut on a word boundary and ellipsised. `max` defaults to
 * EXCERPT_CHARS; a shorter body is returned untouched (no dangling "…").
 */
export function toExcerpt(markdown: string, max: number = EXCERPT_CHARS): string {
  const text = toPlainText(markdown);
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}
