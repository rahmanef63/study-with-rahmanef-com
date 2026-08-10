/** Chart fence spec + parsing — recharts-free so ChartBlock can import it
 *  without pulling recharts into the markdown bundle. */

export interface ChartSpec {
  type: "bar" | "line" | "area" | "pie";
  data: Array<Record<string, unknown>>;
  xKey?: string;
  series?: string[];
  title?: string;
}

export function parseSpec(text: string): ChartSpec | null {
  try {
    const spec = JSON.parse(text) as ChartSpec;
    if (!spec || !Array.isArray(spec.data) || !spec.data.length) return null;
    if (!["bar", "line", "area", "pie"].includes(spec.type)) return null;
    return spec;
  } catch {
    return null;
  }
}

export function seriesKeys(spec: ChartSpec): string[] {
  if (spec.series?.length) return spec.series;
  const first = spec.data[0] ?? {};
  return Object.keys(first).filter((k) => typeof first[k] === "number");
}
