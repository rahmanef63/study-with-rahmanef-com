import { serverRelease } from "@/lib/server-release";

// Frontend liveness only. A backend outage must not trigger a restart loop.
export function GET() {
  const release = serverRelease();
  const ready = release.id !== "unknown";
  return Response.json({ status: ready ? "ok" : "unavailable", ...release }, {
    status: ready ? 200 : 503,
    headers: { "cache-control": "no-store" },
  });
}
