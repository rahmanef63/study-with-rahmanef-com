// Minimal compatibility definitions still imported by notion-app/lib/tools.ts.
type ToolDef<Ctx> = {
  name: string;
  description: string;
  parameters: unknown;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  run: (ctx: Ctx, args: any) => string | Promise<string>;
};

export function defineToolCollection<Ctx = unknown>(def: {
  namespace: string;
  describe?: (ctx: Ctx) => string;
  instructions?: string;
  tools: ToolDef<Ctx>[];
}) {
  return def;
}

export const str = (_desc?: string, _opts?: unknown): unknown => ({ type: "string" });
export const obj = (_shape?: Record<string, unknown>): unknown => ({ type: "object" });
