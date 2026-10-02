// Visible page title. The shell provides community context as text; each
// task surface owns exactly one h1. Preserve the existing routes and labels.
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageHeading({
  title,
  description,
  actions,
  className,
}: {
  title: ReactNode;
  /** One line of orientation. Omit unless the title genuinely is not enough. */
  description?: ReactNode;
  /** Share button and friends. Wraps under the title on a narrow container. */
  actions?: ReactNode;
  /** Pass `mb-0` when the parent already owns the rhythm with `space-y-*`;
   *  otherwise the default 20px and the parent's gap stack into 40px. */
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-5 flex flex-wrap items-start justify-between gap-x-4 gap-y-2 border-b pb-3",
        className
      )}
    >
      <div className="min-w-0 space-y-1">
        <h1 className="font-display text-headline [overflow-wrap:anywhere]">
          {title}
        </h1>
        {description ? (
          <p className="max-w-2xl text-pretty text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}
