// Ported from notion-page-clone editor/blocks/DatabasePicker.tsx — the
// /database slash-command picker.
//
// SEAM NOTE: the source read a full `databases: Database[]` list off
// `useEditorAdapter()` (the databases slice). rr's seam does NOT carry that
// list — databases invert through `EditorAdapter.database.pickDatabase()`, a
// host-owned picker (see lib/adapter.ts DatabaseAdapter). So when a database
// adapter is wired we delegate to its picker; the popover below is the
// graceful fallback shown when no database capability is present, so the
// /database command still renders inert chrome instead of throwing. The
// `rankDatabases` ranking helper is preserved for hosts that later feed a
// candidate list through this surface.
import { useEffect } from "react";
import { Database as DatabaseIcon } from "lucide-react";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { useEditorAdapter } from "@notion/slices/editor/lib/adapterContext";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onPick: (databaseId: string) => void;
}

export function DatabasePicker({ open, onOpenChange, onPick }: Props) {
  const { database } = useEditorAdapter();
  const pickDatabase = database?.pickDatabase;

  // When the host wires a database adapter, hand control to its picker — it
  // owns the candidate list + ranking UI. We never render our own list because
  // the seam doesn't expose the underlying Database[] needed to populate it.
  useEffect(() => {
    if (!open || !pickDatabase) return;
    let cancelled = false;
    void (async () => {
      const id = await pickDatabase();
      if (cancelled) return;
      if (id) onPick(id);
      onOpenChange(false);
    })();
    return () => { cancelled = true; };
    // onPick / onOpenChange are stable callbacks from the caller.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, pickDatabase]);

  // No database capability wired → inert placeholder popover.
  if (pickDatabase) return null;

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverAnchor className="block h-0 w-0" />
      <PopoverContent className="w-80 p-0" align="start" side="bottom" sideOffset={6}>
        <div className="flex flex-col items-center gap-1.5 px-3 py-6 text-center text-xs text-muted-foreground">
          <DatabaseIcon className="h-4 w-4" />
          Databases aren&apos;t available in this editor.
        </div>
      </PopoverContent>
    </Popover>
  );
}
