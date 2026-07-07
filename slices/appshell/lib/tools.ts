// Agentic tool collection. The shell is NOT an agent — it exports this
// collection of function-calling tools and ONE shared agent (e.g. the
// assistant host) drives it alongside other slices' collections via
// @/shared/agentic. Shell state is the module-level external store, so the
// ctx is empty — every tool acts on the singleton action functions.

import { defineToolCollection, noArgs, num, obj, str } from "@/shared/agentic";
import {
  closeWindow,
  focusApp,
  focusWindow,
  minimizeWindow,
  openWindow,
  restoreWindow,
  shellStore,
  toggleMaximize,
} from "./store";
import { applyProfile, listProfiles, saveProfile } from "./profiles";
import { setActiveSpace } from "./spaces";
import { toast } from "./toast";

export type AppshellCtx = Record<string, never>;

const listWindows = (): string =>
  shellStore
    .getOrder()
    .map((id) => {
      const w = shellStore.getWindow(id);
      if (!w) return null;
      const flags = [w.minimized && "min", w.maximized && "max", id === shellStore.getFocused() && "focused"]
        .filter(Boolean)
        .join(",");
      return `${id} app=${w.app} "${w.title}" space=${w.spaceId ?? 1}${flags ? ` [${flags}]` : ""}`;
    })
    .filter(Boolean)
    .join("\n") || "no windows open";

export const appshellTools = defineToolCollection<AppshellCtx>({
  namespace: "appshell",
  describe: () => listWindows(),
  instructions:
    "Drives the desktop shell: launch apps by slug, then arrange/focus/close their windows. " +
    "Launch an app before acting on its window; check window.list for live window ids.",
  tools: [
    {
      name: "window.list",
      description: "List open windows: id, app, title, space, min/max/focused flags.",
      parameters: noArgs,
      run: () => listWindows(),
    },
    {
      name: "app.launch",
      description: "Open an app window by its registered app id.",
      parameters: obj({ "app!": str("app id (e.g. browser, files)"), title: str("window title (defaults to the app id)") }),
      run: (_ctx, a) => {
        const id = openWindow(a.app as string, (a.title as string) ?? (a.app as string));
        return `opened window ${id}`;
      },
    },
    {
      name: "app.focus",
      description: "Focus (or restore) the most recent window of an app.",
      parameters: obj({ "app!": str("app id") }),
      run: (_ctx, a) => (focusApp(a.app as string) ? `focused ${a.app}` : `no window for ${a.app}`),
    },
    {
      name: "window.close",
      description: "Close a window by its window id.",
      parameters: obj({ "id!": str("window id") }),
      run: (_ctx, a) => {
        closeWindow(a.id as string);
        return `closed ${a.id}`;
      },
    },
    {
      name: "window.focus",
      description: "Focus a window by its window id.",
      parameters: obj({ "id!": str("window id") }),
      run: (_ctx, a) => {
        focusWindow(a.id as string);
        return `focused ${a.id}`;
      },
    },
    {
      name: "window.minimize",
      description: "Minimize a window.",
      parameters: obj({ "id!": str("window id") }),
      run: (_ctx, a) => {
        minimizeWindow(a.id as string);
        return `minimized ${a.id}`;
      },
    },
    {
      name: "window.restore",
      description: "Restore a minimized window.",
      parameters: obj({ "id!": str("window id") }),
      run: (_ctx, a) => {
        restoreWindow(a.id as string);
        return `restored ${a.id}`;
      },
    },
    {
      name: "window.toggle_maximize",
      description: "Toggle a window between maximized and its previous rect.",
      parameters: obj({ "id!": str("window id") }),
      run: (_ctx, a) => {
        toggleMaximize(a.id as string);
        return `toggled ${a.id}`;
      },
    },
    {
      name: "space.set",
      description: "Switch the active virtual desktop (1–4).",
      parameters: obj({ "n!": num("space number", { min: 1, max: 4 }) }),
      run: (_ctx, a) => {
        setActiveSpace(a.n as number);
        return `space ${a.n}`;
      },
    },
    {
      name: "profile.save",
      description: "Save the current window layout as a named session profile.",
      parameters: obj({ name: str("profile name (auto when omitted)") }),
      run: (_ctx, a) => `saved profile "${saveProfile((a.name as string) ?? undefined)}"`,
    },
    {
      name: "profile.apply",
      description: "Apply a saved session profile.",
      parameters: obj({ "name!": str("profile name") }),
      run: (_ctx, a) =>
        applyProfile(a.name as string)
          ? `applied "${a.name}"`
          : `no profile "${a.name}" (have: ${listProfiles().join(", ") || "none"})`,
    },
    {
      name: "notify",
      description: "Show a toast notification in the shell.",
      parameters: obj({ "message!": str("toast text") }),
      run: (_ctx, a) => {
        toast(a.message as string);
        return "notified";
      },
    },
  ],
});
