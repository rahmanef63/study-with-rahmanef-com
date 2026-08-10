"use client";

/** Renders a ```mermaid fence as an SVG diagram. Mermaid is heavy (~1MB) so
 *  it's dynamically imported on first render and initialised once per app.
 *  Invalid diagram source falls back to the raw text in a code block. */

import * as React from "react";

let mermaidReady: Promise<typeof import("mermaid").default> | null = null;

function loadMermaid() {
  if (!mermaidReady) {
    mermaidReady = import("mermaid").then((m) => {
      m.default.initialize({ startOnLoad: false, securityLevel: "strict", theme: "neutral" });
      return m.default;
    });
  }
  return mermaidReady;
}

let seq = 0;

export function MermaidBlock({ text }: { text: string }) {
  const [svg, setSvg] = React.useState<string | null>(null);
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    let alive = true;
    setSvg(null);
    setError(false);
    loadMermaid()
      .then((mermaid) => mermaid.render(`md-mmd-${++seq}`, text))
      .then(({ svg }) => { if (alive) setSvg(svg); })
      .catch(() => { if (alive) setError(true); });
    return () => { alive = false; };
  }, [text]);

  if (error) {
    return (
      <pre className="my-3 overflow-x-auto rounded-md border border-destructive/40 bg-muted/40 p-3 text-xs">
        <code className="font-mono">{text}</code>
      </pre>
    );
  }
  if (!svg) {
    return <div className="my-3 h-32 animate-pulse rounded-md border border-border bg-muted/30" aria-label="Rendering diagram…" />;
  }
  // Mermaid output is sanitised by mermaid itself (securityLevel: "strict").
  return (
    <div
      className="my-3 flex justify-center overflow-x-auto rounded-md border border-border bg-background p-3 [&_svg]:max-w-full"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
