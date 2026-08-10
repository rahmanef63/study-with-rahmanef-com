import { defineFeature } from "@/shared/features/defineFeature";

/**
 * `markdown` — markdown (.md) page container with optional CRUD surfaces:
 * Read (rich text), Write (source editor + live preview), Review
 * (block-anchored comments). Renders ```mermaid diagrams and ```chart charts.
 * Sibling surface to the `notion` block editor: both speak the same markdown
 * grammar, so content authored as notion blocks (serialised via
 * `@notion/shared/lib/markdown` → `blocksToMarkdown`) renders here identically.
 * Self-contained — its own parser + inline renderer, no notion runtime dep.
 */
export const markdownFeature = defineFeature({
  slug: "markdown",
  title: "Markdown — page container with CRUD tabs + diagrams",
  category: "content",
  routes: [],
  nav: { label: "Markdown", group: "content", order: 62 },
});
