/** Lightweight inline-markdown renderer for read-only surfaces (public
 *  share view, exports). Editor input remains plain text — markers are
 *  source-of-truth.
 *
 *  Supported:
 *    **bold**          → <strong>
 *    *italic* / _it_   → <em>
 *    ~~strike~~        → <del>
 *    `code`            → <code>
 *    [label](url)      → <a>  (http/https only)
 *    bare http(s)://…  → <a>
 *
 *  Greedy left-to-right, no nesting beyond one level — sufficient for the
 *  90% block-editor case. Returns React children, not HTML strings, so
 *  there is no XSS surface. */

import * as React from "react";
import Link from "next/link";
import { MathSpan } from "./katex-lazy";

/** Strip inline-markdown markers from a plain-text source. Inverse of
 *  the wrap-with-marker behavior in `SelectionToolbar`. Used by the
 *  toolbar's eraser button. Pure — testable without DOM. */
export function stripMd(s: string): string {
  return s
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/~~(.+?)~~/g, "$1")
    .replace(/(^|\W)_([^_]+?)_(?=\W|$)/g, "$1$2")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\((?:https?:\/\/|\/)[^\s)]+\)/g, "$1");
}

const BOLD = /\*\*([^*\n]+)\*\*/;
const STRIKE = /~~([^~\n]+)~~/;
const CODE = /`([^`\n]+)`/;
const ITALIC = /(?:\*([^*\n]+)\*|_([^_\n]+)_)/;
// Inline math `$...$` — single-dollar form, no whitespace right after `$`.
const MATH = /\$([^$\n]+)\$/;
// Allow relative `/path` for internal mentions in addition to http(s).
// `javascript:` and other dangerous schemes are excluded by anchoring
// to `https?://` or `/`.
const LINK_MD = /\[([^\]]+)\]\(((?:https?:\/\/|\/)[^\s)]+)\)/;
const BARE_URL = /(https?:\/\/[^\s)]+)/;

type Token =
  | { kind: "text"; value: string }
  | { kind: "bold" | "italic" | "strike" | "code" | "math"; inner: string }
  | { kind: "link"; label: string; href: string };

/** Tokenise a single line. Order matters: code first to swallow markers
 *  inside backticks, then bold (longer marker than italic), strike, italic,
 *  links, bare urls. */
export function tokenizeInline(input: string): Token[] {
  if (!input) return [];
  const out: Token[] = [];
  let buf = input;
  while (buf.length > 0) {
    const matches: Array<{ idx: number; len: number; tok: Token }> = [];
    push(matches, buf.match(CODE), (m) => ({ kind: "code", inner: m[1] }));
    push(matches, buf.match(MATH), (m) => ({ kind: "math", inner: m[1] }));
    push(matches, buf.match(BOLD), (m) => ({ kind: "bold", inner: m[1] }));
    push(matches, buf.match(STRIKE), (m) => ({ kind: "strike", inner: m[1] }));
    push(matches, buf.match(ITALIC), (m) => ({ kind: "italic", inner: m[1] ?? m[2] }));
    push(matches, buf.match(LINK_MD), (m) => ({ kind: "link", label: m[1], href: m[2] }));
    push(matches, buf.match(BARE_URL), (m) => ({ kind: "link", label: m[1], href: m[1] }));

    if (matches.length === 0) {
      out.push({ kind: "text", value: buf });
      break;
    }
    matches.sort((a, b) => a.idx - b.idx);
    const first = matches[0];
    if (first.idx > 0) out.push({ kind: "text", value: buf.slice(0, first.idx) });
    out.push(first.tok);
    buf = buf.slice(first.idx + first.len);
  }
  return out;
}

function push(
  out: Array<{ idx: number; len: number; tok: Token }>,
  m: RegExpMatchArray | null,
  build: (m: RegExpMatchArray) => Token,
) {
  if (m && m.index !== undefined) {
    out.push({ idx: m.index, len: m[0].length, tok: build(m) });
  }
}

/** Render the tokens as React children. */
export function renderInline(input: string): React.ReactNode {
  const tokens = tokenizeInline(input);
  return tokens.map((t, i) => {
    switch (t.kind) {
      case "text":
        return <React.Fragment key={i}>{t.value}</React.Fragment>;
      case "bold":
        return <strong key={i}>{t.inner}</strong>;
      case "italic":
        return <em key={i}>{t.inner}</em>;
      case "strike":
        return <del key={i}>{t.inner}</del>;
      case "code":
        return <code key={i} className="rounded bg-muted/70 px-1 py-0.5 font-mono text-[0.9em]">{t.inner}</code>;
      case "math":
        return <MathSpan key={i} tex={t.inner} />;
      case "link": {
        const internal = t.href.startsWith("/");
        const cls = "text-brand underline-offset-2 hover:underline";
        if (internal) {
          return (
            <Link key={i} href={t.href} className={cls}>
              {t.label}
            </Link>
          );
        }
        return (
          <a
            key={i}
            href={t.href}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className={cls}
          >
            {t.label}
          </a>
        );
      }
    }
  });
}
