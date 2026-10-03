/** React-only inline rendering. Nested formatting is resolved without HTML strings. */
import * as React from "react";
import Link from "next/link";
import { MathSpan } from "./katex-lazy";
import { safeMarkdownUrl } from "./media";
import { markdownLinkAt, trimBareUrl } from "./inline-links";

type Token =
  | { kind: "text"; value: string }
  | { kind: "bold" | "italic" | "strike" | "code" | "math"; inner: string }
  | { kind: "link"; label: string; href: string }
  | { kind: "break" };
const marks = [
  { kind: "bold", pattern: /^(\*\*|__)(?=\S)([\s\S]*?\S)\1(?![*_])/ },
  { kind: "strike", pattern: /^(~~)(?=\S)([\s\S]*?\S)\1/ },
  { kind: "italic", pattern: /^(\*)(?!\*)(?=\S)([\s\S]*?\S)\1(?!\*)/ },
  { kind: "italic", pattern: /^(_)(?!_)(?=\S)([\s\S]*?\S)\1(?![\p{L}\p{N}_])/u },
] as const;

export function tokenizeInline(input: string): Token[] {
  const out: Token[] = [];
  let text = "";
  const flush = () => { if (text) { out.push({ kind: "text", value: text }); text = ""; } };
  for (let i = 0; i < input.length;) {
    const tail = input.slice(i);
    const hardBreak = tail.match(/^(?: {2,}|\\)\n/);
    if (hardBreak) { flush(); out.push({ kind: "break" }); i += hardBreak[0].length; continue; }
    if (input[i] === "\\" && /[\\`*{}_\[\]()#+.!|~$]/.test(input[i + 1] ?? "")) { text += input[i + 1]; i += 2; continue; }
    const ticks = tail.match(/^`+/)?.[0];
    const close = ticks ? tail.slice(ticks.length).match(new RegExp("(?<!`)(`{" + ticks.length + "})(?!`)")) : null;
    if (ticks && close?.index !== undefined) {
      flush(); out.push({ kind: "code", inner: tail.slice(ticks.length, ticks.length + close.index).replace(/\n/g, " ") });
      i += ticks.length * 2 + close.index; continue;
    }
    const math = tail.match(/^\$([^$\n]+)\$/);
    if (math) { flush(); out.push({ kind: "math", inner: math[1] }); i += math[0].length; continue; }
    const link = markdownLinkAt(input, i);
    if (link) { flush(); out.push({ kind: "link", label: link.label, href: link.href }); i += link.length; continue; }
    const url = tail.match(/^https?:\/\/[^\s<>]+/);
    if (url) {
      const href = trimBareUrl(url[0]);
      if (safeMarkdownUrl(href)) { flush(); out.push({ kind: "link", label: href, href }); i += href.length; continue; }
    }
    const mark = marks.find(({ pattern }) => pattern.test(tail) && !(tail[0] === "_" && /[\p{L}\p{N}]/u.test(input[i - 1] ?? "")));
    if (mark) { const match = tail.match(mark.pattern)!; flush(); out.push({ kind: mark.kind, inner: match[2] }); i += match[0].length; continue; }
    text += input[i++];
  }
  flush();
  return out;
}

export function renderInline(input: string, depth = 0, inLink = false): React.ReactNode {
  if (depth >= 16) return input;
  return tokenizeInline(input).map((token, i) => {
    const nested = (value: string) => renderInline(value, depth + 1, inLink);
    switch (token.kind) {
      case "text": return <React.Fragment key={i}>{token.value}</React.Fragment>;
      case "break": return <br key={i} />;
      case "bold": return <strong key={i}>{nested(token.inner)}</strong>;
      case "italic": return <em key={i}>{nested(token.inner)}</em>;
      case "strike": return <del key={i}>{nested(token.inner)}</del>;
      case "code": return <code key={i} translate="no" className="notranslate rounded bg-muted/70 px-1 py-0.5 font-mono text-[0.9em]">{token.inner}</code>;
      case "math": return <MathSpan key={i} tex={token.inner} />;
      case "link": {
        const label = token.label === token.href ? token.label : renderInline(token.label, depth + 1, true);
        if (inLink) return <React.Fragment key={i}>{label}</React.Fragment>;
        const className = "break-words text-primary underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-ring";
        if (token.href.startsWith("/") || token.href.startsWith("#")) return <Link key={i} href={token.href} className={className}>{label}</Link>;
        return <a key={i} href={token.href} target="_blank" rel="noopener noreferrer nofollow" className={className}>{label}</a>;
      }
    }
  });
}
