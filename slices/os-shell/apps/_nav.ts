// Deep-linkable app navigation. appshell's URL-sync mirrors ONLY `payload.path`
// to the address bar (`/<slug>/<path>`) and re-hydrates a pasted deep link back
// into `payload = { path }`. So cross-app opens must encode their params as a
// path string (not a structured object) for the link to be shareable AND to
// survive a reload. `openApp` builds that path + looks up the app's manifest
// `defaultSize` (openWindow with undefined size falls back to 720×460, ignoring
// the descriptor); `seg` parses the path back into segments on the receiving end.
import { openWindow } from "@/features/appshell";
import { APPS } from "../manifest";

/** Open an app with URL-shareable params. `segs` become `/<slug>/<seg>/<seg>`. */
export function openApp(appId: string, title: string, segs: Array<string | undefined> = []) {
  const size = APPS.find((a) => a.id === appId)?.defaultSize;
  const path = segs.filter((s): s is string => Boolean(s)).map(encodeURIComponent).join("/");
  return openWindow(appId, title, size, path ? { path } : undefined);
}

/** Parse `payload.path` (from openApp OR a deep link) into decoded segments. */
export function seg(payload: unknown): string[] {
  const p = (payload as { path?: unknown } | null | undefined)?.path;
  return typeof p === "string" ? p.split("/").filter(Boolean).map(decodeURIComponent) : [];
}
