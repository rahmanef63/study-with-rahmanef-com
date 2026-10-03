import { loadYoutubeMetadata } from "@/lib/youtube-metadata";
export const runtime = "nodejs";
export async function GET(request: Request) {
  const url = new URL(request.url);
  if ([...url.searchParams.keys()].some(key => key !== "id")) return new Response(null, { status: 400 });
  const id = url.searchParams.get("id") ?? "";
  if (!/^[A-Za-z0-9_-]{11}$/.test(id)) return new Response(null, { status: 400 });
  const value = await loadYoutubeMetadata(id);
  return Response.json(value, { headers: { "cache-control": value ? "public, max-age=3600" : "no-store" } });
}
