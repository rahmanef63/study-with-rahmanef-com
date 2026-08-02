"use client";
// OsRoot — mounts the desktop. <AppShell> owns its whole provider stack
// (capabilities/brand/registry/responsive) + window store; it only needs the
// app-level Convex + theme providers, which the root layout already supplies.
import { useEffect, useMemo } from "react";
import { AppShell, shellStore, closeWindow } from "@/features/appshell";
// PERF: light sub-barrel — eager entry; the full tenants barrel would drag all
// its views into the initial JS chunk.
import { useMyPlatformAdmin } from "@/features/tenants/hooks";
import { shellManifest } from "./manifest";
import { BootBeranda } from "./boot-beranda";
import { ShellCommands } from "./shell-commands";
import { ShellActivity } from "./shell-activity";

// Apps yang DIPARKIR owner — disaring dari registry SEMUA shell
// (dock/launcher/sidebar) tapi kodenya tetap hidup & teruji. Saat diaktifkan:
// hapus id-nya dari sini (asisten #35: juga set env ANTHROPIC_API_KEY + deploy).
const PARKED_APP_IDS = ["asisten"];

export function OsRoot() {
  // Hide the platform-admin app from the app registry for everyone but platform
  // admins — this is the ONE seam covering every shell's dock/launcher/sidebar
  // (appshell rebuilds the registry from manifest.apps, so this is reactive).
  // Server authz + the app's own denied state remain the real guards. Keep the
  // original manifest object identity for admins to avoid needless AppShell churn.
  const admin = useMyPlatformAdmin();
  const manifest = useMemo(
    () => ({
      ...shellManifest,
      apps: shellManifest.apps.filter(
        (a) =>
          !PARKED_APP_IDS.includes(a.id) &&
          (a.id !== "admin" || admin?.isPlatformAdmin === true)
      ),
    }),
    [admin?.isPlatformAdmin],
  );

  // Windows persist to a browser-GLOBAL localStorage key, so a prior admin
  // session on a shared browser can leave a stray "admin" window for the next
  // (non-admin) user — a harmless "Unknown app" ghost, but confusing. Once admin
  // status has RESOLVED (never during the loading flash, so an admin's own window
  // is safe), close any open window whose app is now hidden from the registry.
  const hiddenAppIds = useMemo(() => {
    const visible = new Set(manifest.apps.map((a) => a.id));
    return shellManifest.apps.map((a) => a.id).filter((id) => !visible.has(id));
  }, [manifest]);
  useEffect(() => {
    if (admin === undefined || hiddenAppIds.length === 0) return;
    for (const id of [...shellStore.getOrder()]) {
      if (hiddenAppIds.includes(shellStore.getWindow(id)?.app ?? "")) closeWindow(id);
    }
  }, [admin, hiddenAppIds]);

  return (
    <>
      <AppShell manifest={manifest} />
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
