import type { SVGProps } from "react";
import { cn } from "@/lib/utils";

/**
 * Brand mark — an open book with a spark above (belajar = learning + growth).
 * Monoline, drawn in `currentColor` so it inherits the surrounding text color
 * and adapts to light/dark + any preset with zero extra wiring.
 */
export function LogoMark({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={cn("size-6", className)}
      {...props}
    >
      {/* spark */}
      <path
        d="M12 1.9 L12.85 3.25 L14.2 4.1 L12.85 4.95 L12 6.3 L11.15 4.95 L9.8 4.1 L11.15 3.25 Z"
        fill="currentColor"
      />
      {/* open book — left + right pages meeting at the spine */}
      <path
        d="M12 9.1 C9.1 7.3 5.9 7.1 3.4 8.1 L3.4 17.9 C5.9 16.9 9.1 17.1 12 18.9"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 9.1 C14.9 7.3 18.1 7.1 20.6 8.1 L20.6 17.9 C18.1 16.9 14.9 17.1 12 18.9"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M12 9.1 L12 18.9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/** Full lockup — mark + wordmark. Wordmark rides the display serif. */
export function Logo({ className, markClassName }: { className?: string; markClassName?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark className={cn("size-6 text-primary", markClassName)} />
      <span className="font-serif text-lg font-semibold leading-none tracking-tight">
        belajar<span className="text-muted-foreground">·with·rahmanef</span>
      </span>
    </span>
  );
}
