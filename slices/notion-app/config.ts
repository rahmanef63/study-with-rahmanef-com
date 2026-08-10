import { defineFeature } from "@/shared/features/defineFeature";

/**
 * `notion` — nested vertical slice (slice-of-slices). Houses the block editor
 * and (future) its sibling inner slices (databases, workspace-sidebar). The
 * cluster owns a private shared layer under `@notion/*` (vendored block/page
 * types, uid, inline-markdown) so inner slices stay decoupled from any host
 * app domain. See CLAUDE.md "Notion Slice Convention".
 *
 * Status: WIP — milestone 1 ports the editor's pure core (block model, slash
 * specs, block-tree/turn-into/markdown/inline-decorator utils). Components +
 * convex land in later milestones behind the EditorAdapter seam.
 */
export const notionAppConfig = defineFeature({
  slug: "notion-app",
  title: "Notion App — Block Editor",
  category: "content",
  routes: [],
  nav: { label: "Notion", group: "content", order: 60 },
});
