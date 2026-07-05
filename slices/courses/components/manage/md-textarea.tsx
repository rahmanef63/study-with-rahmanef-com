"use client";
// courses slice — markdown source textarea for the lesson editor.
// components/ui has no vendored shadcn `textarea` yet and components/ui is
// integrator-only; this slice-local primitive mirrors shadcn's Textarea
// classes so a later swap is invisible to consumers.
// TODO(rr): propose `npx shadcn add textarea` to alpha, then replace this
// with `@/components/ui/textarea`.
import * as React from "react";

export type MdTextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const MdTextarea = React.forwardRef<HTMLTextAreaElement, MdTextareaProps>(
  function MdTextarea({ className, ...props }, ref) {
    const base =
      "flex min-h-48 w-full rounded-md border border-input bg-transparent px-3 py-2 font-mono text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";
    return <textarea ref={ref} className={className ? `${base} ${className}` : base} {...props} />;
  }
);
