"use client";

// Install row for the shared nav. The desktop rail and the phone drawer both
// mount that nav, so this single button is the install control in both places.
// It stays out of the dock: a fifth always-visible cell would advertise an
// action the browser often cannot perform.
import { useSyncExternalStore } from "react";
import { Download } from "lucide-react";
import {
  promptPwaInstall,
  readInstallOffer,
  subscribeInstall,
} from "./install-availability";

function subscribe(onStoreChange: () => void) {
  return subscribeInstall(onStoreChange);
}

/** Server and the hydration snapshot: no prompt exists yet, so no button. */
function hiddenOnServer() {
  return false;
}

export function PwaInstallButton({ onNavigate }: { onNavigate?: () => void }) {
  // External browser state. The server snapshot is always hidden, so a dead
  // button never ships in the HTML. The client snapshot updates when Chromium
  // fires beforeinstallprompt or the app becomes standalone.
  const canInstall = useSyncExternalStore(subscribe, readInstallOffer, hiddenOnServer);

  if (!canInstall) return null;

  return (
    <div className="px-2 pb-1">
      <button
        type="button"
        className="pixel-press flex min-h-11 w-full items-center gap-3 px-3 text-sm text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground md:min-h-9"
        onClick={() => {
          // prompt() must run inside this click. Closing the drawer afterwards
          // does not cancel it — the dialog belongs to the browser, not the sheet.
          void promptPwaInstall();
          onNavigate?.();
        }}
      >
        <Download className="size-4 shrink-0" aria-hidden />
        <span className="min-w-0 truncate">Pasang aplikasi</span>
      </button>
    </div>
  );
}
