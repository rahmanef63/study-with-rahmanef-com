import { serverRelease } from "@/lib/server-release";

export function GET() {
  return Response.json(serverRelease(), { headers: { "cache-control": "no-store" } });
}
