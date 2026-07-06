import { readFileSync } from "node:fs";
import { join } from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

let id: string | null = null;

export function GET() {
  if (id === null) {
    try {
      id = readFileSync(join(process.cwd(), ".next/BUILD_ID"), "utf8").trim() || "unknown";
    } catch {
      id = "unknown";
    }
  }
  return Response.json({ id }, { headers: { "cache-control": "no-store" } });
}
