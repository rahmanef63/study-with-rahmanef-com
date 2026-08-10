"use client";

/** Lazy KaTeX renderer. KaTeX is ~280kB so it's dynamically imported on the
 *  first math render and cached at module level — same pattern as the
 *  markdown slice's MermaidBlock. Until the module lands, the raw TeX source
 *  shows as code, then the span upgrades in place. Vendored alongside
 *  `inlineMd` (notion-private shared). KaTeX sanitises its own HTML output. */

import * as React from "react";

type Katex = typeof import("katex").default;

let katexMod: Katex | null = null;
let katexReady: Promise<Katex> | null = null;

function loadKatex(): Promise<Katex> {
  if (!katexReady) {
    katexReady = import("katex").then((m) => {
      katexMod = m.default;
      return m.default;
    });
  }
  return katexReady;
}

export function MathSpan({ tex, display = false }: { tex: string; display?: boolean }) {
  const [lib, setLib] = React.useState<Katex | null>(katexMod);
  React.useEffect(() => {
    let alive = true;
    if (!lib) void loadKatex().then((k) => { if (alive) setLib(k); });
    return () => { alive = false; };
  }, [lib]);

  if (!lib) {
    return display ? (
      <div className="my-3 overflow-x-auto">
        <code className="font-mono text-sm text-muted-foreground">{tex}</code>
      </div>
    ) : (
      <code className="font-mono text-[0.9em] text-muted-foreground">{tex}</code>
    );
  }
  const html = lib.renderToString(tex, { throwOnError: false, displayMode: display });
  return display ? (
    <div className="my-3 overflow-x-auto" dangerouslySetInnerHTML={{ __html: html }} />
  ) : (
    <span dangerouslySetInnerHTML={{ __html: html }} />
  );
}
