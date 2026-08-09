"use client";
// Pengaturan — the OS Settings app. Per-shell navigation chrome around ONE shared
// set of sections, mirroring os-vps' os-settings: iOS/Android push a nav-stack,
// macOS shows a colored sidebar, Windows/Dashboard a top tab strip. The section
// BODIES are reused verbatim (theme gallery, shell picker, account, profile, about)
// — only the nav differs by shell, resolved from useActiveShell() (the per-shell
// feature-config seam). Registered WITHOUT `scrollize`: every layout owns its own
// scroll (SectionDetail's ScrollArea / MasterDetail / sidebar), matching os-vps.
import { useState } from "react";
import { type AppProps, AppFrame, MasterDetail, useActiveShell } from "@/features/appshell";
import { SettingsTabs, SettingsSidebar, type SectionId } from "./settings/nav";
import { SectionDetail, SectionList } from "./settings/sections";

export default function PengaturanApp(_props: AppProps) {
  // The active shell drives the Settings layout (same sections, different nav chrome).
  const { id: shellId, surface } = useActiveShell();
  // Mobile starts on the section list (no drill-in); desktop always shows a pane.
  // `null` = list view, an id = detail view.
  const [active, setActive] = useState<SectionId | null>(surface === "mobile" ? null : "tampilan");

  const layout: "stack" | "sidebar" | "tabs" =
    surface === "mobile" ? "stack" : shellId === "macos" ? "sidebar" : "tabs";

  // Mobile (iOS/Android): MasterDetail drill-down. The mobile shell chrome already
  // paints the app title above this, so no in-pane large title on the list.
  if (layout === "stack") {
    return (
      <AppFrame>
        <MasterDetail
          master={<SectionList active={active} onSelect={setActive} />}
          detail={active ? <SectionDetail id={active} /> : null}
          hasSelection={active !== null}
          onBack={() => setActive(null)}
          backLabel="Pengaturan"
          masterClassName="w-full"
        />
      </AppFrame>
    );
  }

  const desktopActive: SectionId = active ?? "tampilan";

  // macOS: System Settings sidebar + detail (colored category tiles at left).
  if (layout === "sidebar") {
    return (
      <AppFrame>
        <div className="flex h-full min-h-0">
          <aside className="w-56 shrink-0 border-r border-border bg-sidebar/40">
            <SettingsSidebar active={desktopActive} onSelect={setActive} />
          </aside>
          <div className="min-w-0 flex-1">
            <SectionDetail id={desktopActive} />
          </div>
        </div>
      </AppFrame>
    );
  }

  // Windows / Dashboard: top tab strip — every section visible at a glance.
  return (
    <AppFrame
      toolbar={
        <div className="bg-sidebar/40">
          <SettingsTabs active={desktopActive} onSelect={setActive} />
        </div>
      }
    >
      <SectionDetail id={desktopActive} />
    </AppFrame>
  );
}
