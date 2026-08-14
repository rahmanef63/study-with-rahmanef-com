// Ported from notion-page-clone editor/blocks/TocBlock.tsx — table-of-contents
// block. SEAM: page blocks now resolved via useEditorData().getPage(pageId)
// (was useEditorAdapter().pages.find).
import { useMemo } from "react";
import { ListTree } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useEditorData } from "@notion/slices/editor/lib/adapterContext";
import type { Block, BlockType, BlockRendererProps } from "@notion/shared/types";

const HEADING_LEVELS: Record<string, number> = { h1: 1, h2: 2, h3: 3, h4: 4 };

interface HeadingEntry {
  id: string;
  text: string;
  level: number;
}

/** Walk page blocks → headings only. Strips inline markdown markers from
 *  display label (bold/italic/etc) so TOC reads as plain text. */
function collectHeadings(blocks: Block[]): HeadingEntry[] {
  const out: HeadingEntry[] = [];
  for (const b of blocks) {
    const level = HEADING_LEVELS[b.type as BlockType];
    if (!level) continue;
    const raw = (b.text ?? "").trim();
    if (!raw) continue;
    out.push({ id: b.id, text: raw.replace(/[*_`~]/g, ""), level });
  }
  return out;
}

function jumpTo(blockId: string) {
  const el = document.querySelector<HTMLElement>(`[data-block-id="${blockId}"]`);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
  el.focus({ preventScroll: true });
}

export function TocBlock({ pageId }: BlockRendererProps) {
  const { getPage } = useEditorData();
  const page = pageId ? getPage(pageId) : undefined;
  const headings = useMemo(() => (page ? collectHeadings(page.blocks) : []), [page]);

  if (headings.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
        <ListTree className="mr-1.5 inline-block h-3 w-3" />
        No headings on this page yet. Add an H1/H2/H3/H4 to populate the table of contents.
      </div>
    );
  }

  return (
    <nav aria-label="Table of contents" className="rounded-md rounded-[var(--radius)] border border-border bg-card px-2 py-2">
      <div className="mb-1 flex items-center gap-1.5 px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        <ListTree className="h-3 w-3" />
        On this page
      </div>
      <ul className="space-y-0.5">
        {headings.map((h) => (
          <li key={h.id}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => jumpTo(h.id)}
              className={cn(
                "h-auto w-full justify-start truncate rounded px-2 py-1 text-left text-xs font-normal text-muted-foreground hover:bg-accent hover:text-foreground",
                h.level === 1 && "font-medium text-foreground",
                h.level === 2 && "pl-4",
                h.level === 3 && "pl-6",
                h.level === 4 && "pl-8",
              )}
            >
              <span className="truncate">{h.text}</span>
            </Button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
