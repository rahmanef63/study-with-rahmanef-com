/** Inline-markdown → React renderer for the reader. Vendored from the notion
 *  cluster's `inlineMd` so the two surfaces resolve the SAME inline grammar —
 *  the round-trip guarantee. Returns React children (no HTML strings → no XSS
 *  surface, except KaTeX which sanitises its own output).
 *
 *  Supported: **bold** · *it* / _it_ · ~~strike~~ · `code` · $math$ ·
 *  [label](url) · bare http(s) urls. Greedy left-to-right, one nesting level. */

import * as React from "react";
import Link from "next/link";
import { MathSpan } from "./katex-lazy";

const BOLD = /\*\*([^*\n]+)\*\*/;
const STRIKE = /~~([^~\n]+)~~/;
const CODE = /`([^`\n]+)`/;
const ITALIC = /(?:\*([^*\n]+)\*|_([^_\n]+)_)/;
const MATH = /\$([^$\n]+)\$/;
const LINK_MD = /\[([^\]]+)\]\(((?:https?:\/\/|\/)[^\s)]+)\)/;
const BARE_URL = /(https?:\/\/[^\s)]+)/;

type Token =
  | { kind: "text"; value: string }
  | { kind: "bold" | "italic" | "strike" | "code" | "math"; inner: string }
  | { kind: "link"; label: string; href: string };

export function tokenizeInline(input: string): Token[] {
  if (!input) return [];
  const out: Token[] = [];
  let buf = input;
  while (buf.length > 0) {
    const m: Array<{ idx: number; len: number; tok: Token }> = [];
    push(m, buf.match(CODE), (x) => ({ kind: "code", inner: x[1]! }));
    push(m, buf.match(MATH), (x) => ({ kind: "math", inner: x[1]! }));
    push(m, buf.match(BOLD), (x) => ({ kind: "bold", inner: x[1]! }));
    push(m, buf.match(STRIKE), (x) => ({ kind: "strike", inner: x[1]! }));
    push(m, buf.match(ITALIC), (x) => ({ kind: "italic", inner: (x[1] ?? x[2])! }));
    push(m, buf.match(LINK_MD), (x) => ({ kind: "link", label: x[1]!, href: x[2]! }));
    push(m, buf.match(BARE_URL), (x) => ({ kind: "link", label: x[1]!, href: x[1]! }));

    if (m.length === 0) { out.push({ kind: "text", value: buf }); break; }
    m.sort((a, b) => a.idx - b.idx);
    const first = m[0]!;
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
  if (m && m.index !== undefined) out.push({ idx: m.index, len: m[0].length, tok: build(m) });
}

export function renderInline(input: string): React.ReactNode {
  return tokenizeInline(input).map((t, i) => {
    switch (t.kind) {
      case "text": return <React.Fragment key={i}>{t.value}</React.Fragment>;
      case "bold": return <strong key={i}>{t.inner}</strong>;
      case "italic": return <em key={i}>{t.inner}</em>;
      case "strike": return <del key={i}>{t.inner}</del>;
      case "code":
        return <code key={i} className="rounded bg-muted/70 px-1 py-0.5 font-mono text-[0.9em]">{t.inner}</code>;
      case "math":
        return <MathSpan key={i} tex={t.inner} />;
      case "link": {
        const internal = t.href.startsWith("/");
        const cls = "text-primary underline-offset-2 hover:underline";
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
