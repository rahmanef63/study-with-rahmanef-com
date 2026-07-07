"use client";
// OsRoot — mounts the desktop. <AppShell> owns its whole provider stack
// (capabilities/brand/registry/responsive) + window store; it only needs the
// app-level Convex + theme providers, which the root layout already supplies.
// The manifest is a stable module constant, so no memoization is needed.
import { AppShell } from "@/features/appshell";
import { shellManifest } from "./manifest";
import { BootBeranda } from "./boot-beranda";
import { ShellCommands } from "./shell-commands";
import { ShellActivity } from "./shell-activity";

export function OsRoot() {
  return (
    <>
      <AppShell manifest={shellManifest} />
      {/* Side-effect siblings (render null): register ⌘K nav commands, and watch
          the signed-in user's communities for new-announcement toasts + a badge
          on the Komunitas dock icon. */}
      <ShellCommands />
      <ShellActivity />
      {/* MUST stay AFTER <AppShell/>: its effect fires after UrlSync's deep-link
          open + usePersistLayout's hydrateBoot restore (fiber post-order). */}
      <BootBeranda />
    </>
  );
}
