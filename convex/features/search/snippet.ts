// search feature — snippet builder: lesson hits never ship raw contentMd
// (#23: "potong contentMd 120 char tanpa markdown mentah"). Pure module —
// unit-tested in snippet.test.ts; the projection layer is the only caller.
import { SNIPPET_MAX } from "./validate";

/** Best-effort markdown → plain text (order matters: fences before inline). */
export function stripMarkdown(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, " ") // fenced code blocks
    .replace(/`([^`]*)`/g, "$1") // inline code
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1") // images → alt text
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // links → label
    .replace(/<[^>]+>/g, " ") // html tags
    .replace(/^#{1,6}\s+/gm, "") // heading markers
    .replace(/^>\s?/gm, "") // blockquote markers
    .replace(/^\s*[-*+]\s+/gm, "") // list bullets
    .replace(/^\s*\d+\.\s+/gm, "") // ordered-list markers
    .replace(/[*_~]{1,3}/g, "") // emphasis/strikethrough markers
    .replace(/\s+/g, " ")
    .trim();
}

/** Plain-text snippet, at most `max` chars (+ ellipsis when truncated). */
export function makeSnippet(contentMd: string, max: number = SNIPPET_MAX): string {
  const plain = stripMarkdown(contentMd);
  if (plain.length <= max) return plain;
  return `${plain.slice(0, max).trimEnd()}…`;
}
