// Ported from notion-page-clone editor/page-editor/PageTitle.tsx — page icon +
// title editor.
//
// SEAM/DROPS:
//   - updatePage via useEditorData() (was useEditorAdapter store).
//   - Interactive icon PICKER dropped: the source wrapped the icon in
//     <IconPickerPopover> (icon-picker slice). The seam has no picker, so the
//     icon is now read-only DISPLAY via vendored PageIcon. A host wanting to
//     change the icon wires its own picker around this.
//   - fullPageDb / updateDatabase branch dropped — the seam carries no database
//     resolution; the title always edits page.title. (Full-page-database titles
//     are a host/databases-slice concern.)
//   - <WikiBadge> dropped (wiki slice, host-side).
//   - <AddCoverButton> dropped (cover slice, host-side).
//   - raw <input> → shadcn <Input>.
import { useEditorData } from "@notion/slices/editor/lib/adapterContext";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { PageIcon } from "@notion/shared/ui/PageIcon";
import { Button } from "@/components/ui/button";
import type { Page } from "@notion/shared/types";

interface Props {
  page: Page;
  firstBlockRef: React.MutableRefObject<Map<string, HTMLElement | null>>;
}

export function PageTitle({ page, firstBlockRef }: Props) {
  const { updatePage } = useEditorData();
  return (
    <>
      <div
        className="text-[78px] leading-none [&_span]:text-[78px]"
        aria-label="Page icon"
      >
        <PageIcon value={page.icon} />
      </div>

      <Input
        value={page.title}
        readOnly={page.locked}
        onChange={(e) => updatePage(page.id, { title: e.target.value })}
        placeholder="Untitled"
        className={cn(
          "mt-3 h-auto w-full border-0 bg-transparent p-0 text-4xl md:text-5xl font-bold tracking-tight shadow-none outline-none focus-visible:ring-0 placeholder:text-muted-foreground/40",
          page.font === "mono" ? "font-mono" : "font-serif",
        )}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === "ArrowDown") {
            e.preventDefault();
            firstBlockRef.current.get(page.blocks[0]?.id ?? "")?.focus();
          }
        }}
      />

      {page.locked && (
        <div className="mt-3 flex items-center gap-2 rounded-md border border-warning/30 bg-warning/10 px-3 py-1.5 text-xs text-warning">
          <span>🔒</span>
          <span className="flex-1">Page is locked. Editing is disabled.</span>
          <Button variant="ghost" onClick={() => updatePage(page.id, { locked: false })} className="h-auto rounded px-2 py-0.5 text-xs font-normal text-warning hover:bg-warning/20">
            Unlock
          </Button>
        </div>
      )}
    </>
  );
}
