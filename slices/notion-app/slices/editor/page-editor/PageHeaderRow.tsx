// The page header strip: breadcrumbs on the left, favorite + "•••" on the
// right. Extracted out of PageEditor so a host can suppress it wholesale
// (`<PageEditor showHeader={false}>`) without the editor growing a second
// layout branch inline.
//
// Why a host would suppress it: every control in this row writes a PAGE-LEVEL
// field (favorite, font, fullWidth, smallText, locked, trashed) plus page
// duplicate/move. A host whose backing record has no columns for those — e.g.
// one storing a single document's blocks on a domain row — cannot persist any
// of it, and a control that silently forgets is worse than an absent one.
import { HeaderBreadcrumbs } from "./HeaderBreadcrumbs";
import { HeaderActions } from "./HeaderActions";
import { PageActionsMenu } from "../PageActionsMenu";
import type { Page } from "@notion/shared/types";

export function PageHeaderRow({ page }: { page: Page }) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-1.5">
      <HeaderBreadcrumbs page={page} />
      <div className="flex items-center gap-1">
        <HeaderActions page={page} />
        <PageActionsMenu page={page} />
      </div>
    </div>
  );
}
