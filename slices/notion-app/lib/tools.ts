// Agentic tool collection for the notion cluster (outer slice). Inner
// editor state is adapter-driven, so the agent ctx mirrors that seam: a
// small injectable page contract the host binds to its PageAdapter /
// workspace store.

import { defineToolCollection, obj, str } from "@/shared/agentic";

export type NotionToolsCtx = {
  /** Each resolves to a short readback (page id / title / matches). */
  createPage: (title: string) => Promise<string>;
  getPage: (pageId: string) => Promise<string>;
  updatePage: (pageId: string, patch: { title?: string }) => Promise<string>;
  search: (query: string) => Promise<string>;
};

export const notionTools = defineToolCollection<NotionToolsCtx>({
  namespace: "notion",
  instructions: "Notion workspace pages. search or page.get to find a page id before page.update; page.create makes a new page.",
  tools: [
    {
      name: "page.create",
      description: "Create a new page with a title.",
      parameters: obj({ "title!": str("page title") }),
      run: (ctx, a) => ctx.createPage(a.title as string),
    },
    {
      name: "page.get",
      description: "Read a page (title + block outline).",
      parameters: obj({ "pageId!": str("page id") }),
      run: (ctx, a) => ctx.getPage(a.pageId as string),
    },
    {
      name: "page.update",
      description: "Update a page's title.",
      parameters: obj({ "pageId!": str("page id"), "title!": str("new title") }),
      run: (ctx, a) => ctx.updatePage(a.pageId as string, { title: a.title as string }),
    },
    {
      name: "search",
      description: "Search pages by text.",
      parameters: obj({ "query!": str("search text") }),
      run: (ctx, a) => ctx.search(a.query as string),
    },
  ],
});
