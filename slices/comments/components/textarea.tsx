"use client";
// comments slice — slice-local textarea primitive. components/ui has no
// vendored shadcn `textarea` yet and components/ui is integrator-only; this
// mirrors shadcn's Textarea classes so a later swap is invisible to consumers
// (same precedent as slices/resources/components/textarea.tsx).
// TODO(rr): propose `npx shadcn add textarea` to alpha, then replace this with
// `@/components/ui/textarea`.
import * as React from "react";
import { cn } from "@/lib/utils";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ className, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        className={cn(
          "flex min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      />
    );
  }
);
