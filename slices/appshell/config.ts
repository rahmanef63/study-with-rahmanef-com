// Slice config export (rr: frontend.configExport = "appshellConfig"). The shell
// declares no apps of its own — the consumer injects them via the manifest.
import type { AppDescriptor } from "./lib/types";

export type AppShellConfig = {
  /** Registry identity — MUST equal slice.json slug/title/category. */
  slug: string;
  title: string;
  category: "os";
  /** Apps mounted into the desktop. Wired by the consumer's manifest. */
  apps: AppDescriptor[];
  /** Optional wallpaper class override (theme token based). */
  wallpaperClassName?: string;
};

export const appshellConfig: AppShellConfig = {
  slug: "appshell",
  title: "AppShell — Desktop + Mobile OS Shell",
  category: "os",
  apps: [],
};

export default appshellConfig;
