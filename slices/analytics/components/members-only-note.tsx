// analytics slice — the qualifier that travels with every reader count.
//
// This exists as a COMPONENT so it cannot be forgotten on the third surface
// that renders a view number. The brief for this slice is explicit: an
// instructor who reads these as visitor counts will draw the wrong conclusion,
// and the platform's own reality makes that easy to do — 8 users against a
// public etalase means most reads of a materi are by people this number cannot
// see.
//
// `variant="badge"` is the inline reminder that sits next to a heading;
// `variant="note"` is the full sentence, rendered once per screen.
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { mergeAnalyticsCopy, type AnalyticsCopyOverride } from "../config/copy";

export type MembersOnlyNoteProps = {
  variant?: "badge" | "note";
  copy?: AnalyticsCopyOverride;
  className?: string;
};

export function MembersOnlyNote({
  variant = "note",
  copy: copyOverride,
  className,
}: MembersOnlyNoteProps) {
  const copy = mergeAnalyticsCopy(copyOverride);

  if (variant === "badge") {
    return (
      <span
        className={cn(
          "inline-flex shrink-0 items-center gap-1 border border-border bg-muted px-1.5 py-0.5 text-caption text-muted-foreground",
          className
        )}
      >
        <Info className="size-3" aria-hidden />
        {copy.membersOnlyBadge}
      </span>
    );
  }

  return (
    <p
      className={cn(
        "flex items-start gap-2 border-2 border-border bg-muted/40 px-3 py-2 text-footnote text-muted-foreground",
        className
      )}
    >
      <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span className="text-pretty">{copy.membersOnlyNote}</span>
    </p>
  );
}
