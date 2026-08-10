# Changelog — markdown

## 0.3.1 — 2026-06-10

- perf: KaTeX (~280kB) now lazy-loads on first math render via `lib/katex-lazy.tsx` (`MathSpan`), mirroring the MermaidBlock pattern. Raw TeX shows as code until the module lands, then upgrades in place. No API change.

## 0.3.0 — 2026-06-10

- Agentic tool collection (`lib/tools.ts`): `markdownTools` — pure parse/toc over the slice's own parser (empty ctx).
