"use client";
// posts slice — slice-local textarea primitive. components/ui has no vendored
// shadcn `textarea` yet and components/ui is integrator-only; this mirrors the
// shadcn classes in THIS app's arcade skin (square, 2px frame, hard offset) so
// a later swap is invisible to consumers (precedent:
// slices/comments/components/textarea.tsx).
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
          "flex min-h-20 w-full border border-input bg-card px-3 py-2 text-sm transition-colors placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      />
    );
  }
);
