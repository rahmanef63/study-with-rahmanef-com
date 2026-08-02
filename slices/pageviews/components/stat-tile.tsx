// pageviews slice — presentational stat tile (pure/props-driven, portable:
// no data fetching, no hardcoded copy). shadcn Card + theme tokens only.
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type StatTileProps = {
  label: string;
  /** Pre-formatted so the tile stays dumb (a count or a label like a country). */
  value: string;
  hint?: string;
  className?: string;
};

export function StatTile({ label, value, hint, className }: StatTileProps) {
  return (
    <Card className={cn("py-4", className)}>
      <CardContent className="space-y-1 px-4">
        <p className="truncate text-2xl font-semibold tabular-nums text-foreground">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}
