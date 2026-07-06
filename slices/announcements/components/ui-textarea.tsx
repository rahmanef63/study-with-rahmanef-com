// announcements slice — slice-local textarea styled like the vendored shadcn
// inputs. TODO(rr): confirm — components/ui has no Textarea and that dir is
// integrator-only; shipping a slice-local twin instead of editing shared
// surfaces. Proposal for alpha: `npx shadcn add textarea`, then swap this file
// for `@/components/ui/textarea` and delete it.
import * as React from "react";
import { cn } from "@/lib/utils";

export function UiTextarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      {...props}
    />
  );
}
