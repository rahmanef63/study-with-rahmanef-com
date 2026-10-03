# Changelog — markdown

## 0.3.1 — 2026-06-10

- perf: KaTeX (~280kB) now lazy-loads on first math render via `lib/katex-lazy.tsx` (`MathSpan`), mirroring the MermaidBlock pattern. Raw TeX shows as code until the module lands, then upgrades in place. No API change.

## 0.3.0 — 2026-06-10

- Agentic tool collection (`lib/tools.ts`): `markdownTools` — pure parse/toc over the slice's own parser (empty ctx).

## 0.4.0 — 2026-10-03

- Preserve soft-wrapped paragraphs, variable-length backtick/tilde code fences and nested prompt code.
- Render nested inline formatting, escaped placeholders, balanced links and semantic nested lists safely.
- Respect escaped/code-span table pipes and nested details/directives; keep raw HTML inert.
- Normalize exact-host YouTube links/directives/iframes to privacy-origin embeds with host-supplied metadata.
- Add keyboard-accessible table/code scrolling and exact-text code copying with failure recovery.
- Expose safe media parsing, metadata provider and unique video collection through the barrel; no renderer fetches.
