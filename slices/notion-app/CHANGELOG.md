# Changelog — notion

## 1.1.1 — 2026-06-10

- perf: KaTeX (~280kB) now lazy-loads on first inline-math render via `shared/lib/katex-lazy.tsx` (`MathSpan`); `inlineMd` math tokens upgrade in place. No API change.

## 1.1.0 — 2026-06-10

- Agentic tool collection (`lib/tools.ts`): `notionTools` — page.create/get/update + search over injectable `NotionToolsCtx` (bind to your PageAdapter/workspace store).
