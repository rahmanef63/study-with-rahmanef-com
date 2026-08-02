// courses slice — minimal markdown parser for the lesson read surface.
// Safe by construction: output is a typed AST rendered as React elements
// (components/markdown-view.tsx) — never dangerouslySetInnerHTML, so any
// HTML in the source stays inert text. Links restricted to http(s).
// TODO(rr): confirm — chose an internal ~150-LOC parser over the rr
// `markdown` slice because installing it needs package.json deps
// (katex/mermaid/recharts) + a new slices/markdown/ dir — both
// integrator-only surfaces in Cowork-parallel mode. Same `content` prop
// contract as rr <MarkdownReader/>, so alpha can swap it in post-v1.
import type { MdBlock, MdInline } from "../types";

const INLINE_PATTERNS: Array<{ re: RegExp; make: (m: RegExpMatchArray) => MdInline }> = [
  { re: /\*\*([^*]+)\*\*/, make: (m) => ({ kind: "bold", text: m[1] }) },
  { re: /\*([^*]+)\*/, make: (m) => ({ kind: "italic", text: m[1] }) },
  { re: /_([^_]+)_/, make: (m) => ({ kind: "italic", text: m[1] }) },
  { re: /`([^`]+)`/, make: (m) => ({ kind: "code", text: m[1] }) },
  {
    re: /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/,
    make: (m) => ({ kind: "link", text: m[1], url: m[2] }),
  },
];

/** Tokenize one line of text into inline marks (flat — no nesting, v1). */
export function parseInline(text: string): MdInline[] {
  const out: MdInline[] = [];
  let rest = text;
  while (rest.length > 0) {
    let earliest: { index: number; match: RegExpMatchArray; make: (m: RegExpMatchArray) => MdInline } | null = null;
    for (const { re, make } of INLINE_PATTERNS) {
      const match = rest.match(re);
      if (match?.index !== undefined && (earliest === null || match.index < earliest.index)) {
        earliest = { index: match.index, match, make };
      }
    }
    if (earliest === null) {
      out.push({ kind: "text", text: rest });
      break;
    }
    if (earliest.index > 0) {
      out.push({ kind: "text", text: rest.slice(0, earliest.index) });
    }
    out.push(earliest.make(earliest.match));
    rest = rest.slice(earliest.index + earliest.match[0].length);
  }
  return out;
}

const HEADING_RE = /^(#{1,3})\s+(.*)$/;
const UL_RE = /^[-*]\s+(.*)$/;
const OL_RE = /^\d+[.)]\s+(.*)$/;
const QUOTE_RE = /^>\s?(.*)$/;
const FENCE_RE = /^```([\w-]*)\s*$/;

/** Parse a markdown string into the block AST rendered by <MarkdownView/>. */
export function parseMarkdown(source: string): MdBlock[] {
  const blocks: MdBlock[] = [];
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  let paragraph: string[] = [];
  let list: { ordered: boolean; items: MdInline[][] } | null = null;
  let code: { lang?: string; lines: string[] } | null = null;

  const flushParagraph = () => {
    if (paragraph.length > 0) {
      blocks.push({ kind: "paragraph", inline: parseInline(paragraph.join(" ")) });
      paragraph = [];
    }
  };
  const flushList = () => {
    if (list !== null) {
      blocks.push({ kind: "list", ordered: list.ordered, items: list.items });
      list = null;
    }
  };

  for (const line of lines) {
    if (code !== null) {
      if (FENCE_RE.test(line)) {
        blocks.push({ kind: "codeblock", text: code.lines.join("\n"), lang: code.lang });
        code = null;
      } else {
        code.lines.push(line);
      }
      continue;
    }

    const fence = line.match(FENCE_RE);
    if (fence) {
      flushParagraph();
      flushList();
      code = { lang: fence[1] || undefined, lines: [] };
      continue;
    }

    if (line.trim() === "") {
      flushParagraph();
      flushList();
      continue;
    }

    const heading = line.match(HEADING_RE);
    if (heading) {
      flushParagraph();
      flushList();
      blocks.push({
        kind: "heading",
        level: heading[1].length as 1 | 2 | 3,
        inline: parseInline(heading[2]),
      });
      continue;
    }

    const quote = line.match(QUOTE_RE);
    if (quote) {
      flushParagraph();
      flushList();
      blocks.push({ kind: "quote", inline: parseInline(quote[1]) });
      continue;
    }

    const ul = line.match(UL_RE);
    const ol = ul === null ? line.match(OL_RE) : null;
    if (ul || ol) {
      flushParagraph();
      const ordered = ol !== null;
      if (list === null || list.ordered !== ordered) {
        flushList();
        list = { ordered, items: [] };
      }
      list.items.push(parseInline((ul ?? ol)![1]));
      continue;
    }

    paragraph.push(line.trim());
  }

  // Unclosed fence: keep the content as a code block rather than dropping it.
  if (code !== null) {
    const open: { lang?: string; lines: string[] } = code;
    blocks.push({ kind: "codeblock", text: open.lines.join("\n"), lang: open.lang });
  }
  flushParagraph();
  flushList();
  return blocks;
}
