// progress slice — presentational mark-complete control. Injected into the
// courses barrel seam LessonView.completionSlot. Pure/props-driven: the
// connected LessonCompletion view owns the data + mutation; this only renders
// the current state. shadcn Button only (no raw <button>, rr UI rules).
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { mergeProgressCopy, type ProgressCopyOverride } from "../config/copy";

export type CompletionButtonProps = {
  isCompleted: boolean;
  isPending: boolean;
  onComplete: () => void;
  copy?: ProgressCopyOverride;
  className?: string;
};

export function CompletionButton({
  isCompleted,
  isPending,
  onComplete,
  copy: copyOverride,
  className,
}: CompletionButtonProps) {
  const copy = mergeProgressCopy(copyOverride);

  if (isCompleted) {
    return (
      <Button
        type="button"
        variant="secondary"
        disabled
        aria-disabled
        className={cn("text-primary", className)}
      >
        <CheckCircle2 aria-hidden /> {copy.completed}
      </Button>
    );
  }

  return (
    <Button
      type="button"
      onClick={onComplete}
      disabled={isPending}
      aria-busy={isPending}
      className={className}
    >
      {isPending ? <Loader2 className="animate-spin" aria-hidden /> : null}
      {isPending ? copy.marking : copy.markComplete}
    </Button>
  );
}
