import { serveMcp } from "@/lib/mcp-transport";
export const runtime = "nodejs";
export const POST = (request: Request) => serveMcp(request, "admin");
export const GET = POST;
export const DELETE = POST;
