// ponytail: no-op stub for the appshell agentic seam. This app has no agent
// host, so the shell's tool collection (slices/appshell/lib/tools.ts) self-
// registers against nothing and its optional AppshellAgentMount is never used.
// Keeping this stub OUTSIDE the vendored slice leaves slices/appshell byte-
// identical to upstream, so `rr update appshell` never conflicts. Swap this for
// the real @/shared/agentic kit if an assistant host is ever added.

export function useAgentTools(_collection: unknown, _ctx: unknown): void {}

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

export const noArgs: unknown = { type: "object", properties: {} };
export const str = (_desc?: string, _opts?: unknown): unknown => ({ type: "string" });
export const num = (_desc?: string, _opts?: unknown): unknown => ({ type: "number" });
export const obj = (_shape?: Record<string, unknown>): unknown => ({ type: "object" });
