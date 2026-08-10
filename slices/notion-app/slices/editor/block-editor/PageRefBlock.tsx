// Ported from notion-page-clone editor/block-editor/PageRefBlock.tsx — the
// page-reference block. SEAM: getPage via useEditorData(); navigation via
// useEditorAdapter().page?.navigateToPage (was @/shared/lib/router useNavigate);
// icon DISPLAY via vendored PageIcon (was icon-picker DynamicIcon).
import { FileText } from "lucide-react";
import {
  useEditorData,
  useEditorAdapter,
} from "@notion/slices/editor/lib/adapterContext";
import { PageIcon } from "@notion/shared/ui/PageIcon";
import { Button } from "@/components/ui/button";
import type { Block } from "@notion/shared/types";

export function PageRefBlock({ block }: { block: Block }) {
  const { getPage } = useEditorData();
  const { page } = useEditorAdapter();
  const navigate = page?.navigateToPage;
  const target = block.pageId ? getPage(block.pageId) : undefined;
  return (
    <Button
      variant="outline"
      onClick={() => target && navigate?.(target.id)}
      draggable={!!target}
      onDragStart={(e) => {
        if (!target) return;
        e.dataTransfer.setData("application/x-page-id", target.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      title={target ? "Drag to sidebar to re-parent" : undefined}
      className="h-auto w-full cursor-grab justify-start gap-2 rounded-md bg-card px-3 py-2 text-left font-normal transition active:cursor-grabbing [&_svg]:size-3.5"
    >
      <PageIcon value={target?.icon} className="text-base shrink-0" />
      <span className="flex-1 text-sm font-medium underline-offset-2 hover:underline">
        {target ? (target.title || "Untitled") : "Missing page"}
      </span>
      <FileText className="h-3.5 w-3.5 text-muted-foreground" />
    </Button>
  );
}
