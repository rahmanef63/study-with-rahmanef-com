// Ported from notion-page-clone editor/page-editor/HeaderBreadcrumbs.tsx —
// ancestor breadcrumb trail. SEAM: getPage via useEditorData(); navigation via
// useEditorAdapter().page?.navigateToPage (was useNavigate + ROUTES.page);
// icon DISPLAY via vendored PageIcon (was icon-picker DynamicIcon).
// DROP: the leading parent-database crumb (page.rowOfDatabaseId → getDatabase
// + ROUTES.database) is removed — the seam exposes no database resolution; the
// host's databases capability owns that crumb. Page-chain crumbs are kept.
import * as React from "react";
import { ChevronRight } from "lucide-react";
import { useEditorData, useEditorAdapter } from "@notion/slices/editor/lib/adapterContext";
import { cn } from "@/lib/utils";
import { PageIcon } from "@notion/shared/ui/PageIcon";
import { Button } from "@/components/ui/button";
import type { Page } from "@notion/shared/types";

export const HeaderBreadcrumbs = React.memo(HeaderBreadcrumbsImpl, (a, b) =>
  a.page.id === b.page.id &&
  a.page.title === b.page.title &&
  a.page.icon === b.page.icon &&
  a.page.parentId === b.page.parentId &&
  a.page.rowOfDatabaseId === b.page.rowOfDatabaseId,
);

function HeaderBreadcrumbsImpl({ page }: { page: Page }) {
  const { getPage } = useEditorData();
  const { page: pageNav } = useEditorAdapter();
  const navigate = pageNav?.navigateToPage;
  const crumbs = React.useMemo(() => {
    const out: Page[] = [];
    let cur: Page | undefined = page;
    while (cur) {
      out.unshift(cur);
      cur = cur.parentId ? getPage(cur.parentId) : undefined;
    }
    return out;
  }, [page, getPage]);

  return (
    <nav className="flex items-center gap-1 text-sm min-w-0 overflow-hidden">
      {crumbs.map((c, i) => (
        <div key={c.id} className="flex items-center gap-1 min-w-0">
          {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
          <Button
            variant="ghost"
            onClick={() => navigate?.(c.id)}
            className={cn(
              "h-auto min-w-0 justify-start gap-1.5 rounded px-1.5 py-1 text-sm font-normal",
              i === crumbs.length - 1 ? "text-foreground" : "text-muted-foreground",
            )}
          >
            <PageIcon value={c.icon} className="text-sm" />
            <span className="truncate max-w-[160px]">{c.title || "Untitled"}</span>
          </Button>
        </div>
      ))}
    </nav>
  );
}
