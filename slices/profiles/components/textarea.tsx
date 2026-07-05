import * as React from "react";

import { cn } from "@/lib/utils";

// TODO(rr): confirm — slice-local Textarea (verbatim shadcn styles, matching
// components/ui/input.tsx tokens) because components/ui lacks textarea.tsx and
// components/ is a shared surface (integrator-only, AGENTS.md §4). Proposal in
// the final report: integrator runs `npx shadcn add textarea`, then this file
// is deleted and imports switch to @/components/ui/textarea.
function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30",
        "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  );
}

export { Textarea };
