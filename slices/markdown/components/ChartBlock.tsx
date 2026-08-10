"use client";

/** Renders a ```chart fence as a recharts chart. The fence body is a JSON
 *  spec:
 *
 *    { "type": "bar" | "line" | "area" | "pie",
 *      "data": [{ "name": "Jan", "value": 12, ... }, ...],
 *      "xKey": "name",          // category key (default "name")
 *      "series": ["value"],     // numeric keys to plot (default: all numbers)
 *      "title": "optional" }
 *
 *  Invalid JSON falls back to the raw text in a code block. recharts (~150kB)
 *  is code-split into ChartCanvas via next/dynamic — it only loads when a valid
 *  chart actually renders, not on every markdown page. Colors come from the
 *  shadcn theme tokens (--chart-1..5). */

import * as React from "react";
import dynamic from "next/dynamic";
import { parseSpec } from "./chart-spec";

const ChartCanvas = dynamic(() => import("./ChartCanvas").then((m) => m.ChartCanvas), {
  ssr: false,
  loading: () => <div className="h-64 w-full animate-pulse rounded bg-muted/40" />,
});

export function ChartBlock({ text }: { text: string }) {
  const spec = React.useMemo(() => parseSpec(text), [text]);
  if (!spec) {
    return (
      <pre className="my-3 overflow-x-auto rounded-md border border-destructive/40 bg-muted/40 p-3 text-xs">
        <code className="font-mono">{text}</code>
      </pre>
    );
  }
  return (
    <figure className="my-3 rounded-md border border-border bg-background p-3">
      {spec.title && (
        <figcaption className="mb-2 text-center text-xs font-medium text-muted-foreground">
          {spec.title}
        </figcaption>
      )}
      <ChartCanvas spec={spec} />
    </figure>
  );
}
