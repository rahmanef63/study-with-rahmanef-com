// Ported from notion-page-clone editor/page-editor/HeaderActions.tsx — the
// page header's right-side action cluster.
//
// SEAM/DROPS: the source pulled `toggleFavorite` + `saving` off the app store
// and composed several host slices. rr keeps only the favorite toggle,
// re-expressed via useEditorData().updatePage(id, { favorite }). Dropped:
//   - `saving` "Saving…/Saved" indicator — no save-state in the editor seam.
//   - <SeenByBadge> — presence store, host-side (skip-listed).
//   - Share button + onShare — sharing slice; host owns it.
//   - Version-history button + onHistory — snapshots slice; host owns it.
//   - <PageActionsMenu> — not yet ported; the host wires its own
//     PageActionsMenu around this header later.
// The host re-adds these through its own header chrome / PageActionsMenu seam.
import { Star } from "lucide-react";
import { useEditorData } from "@notion/slices/editor/lib/adapterContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { Page } from "@notion/shared/types";

interface Props {
  page: Page;
}

export function HeaderActions({ page }: Props) {
  const { updatePage } = useEditorData();
  return (
    <div className="flex items-center gap-1 shrink-0">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => updatePage(page.id, { favorite: !page.favorite })}
        className="h-8 w-8 text-muted-foreground"
        aria-label="Favorite"
      >
        <Star className={cn("h-4 w-4", page.favorite && "fill-brand text-brand")} />
      </Button>
    </div>
  );
}
