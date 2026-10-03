"use client";

// Install row for the shared nav. The desktop rail and the phone drawer both
// mount that nav, so this single button is the install control in both places.
// It stays out of the dock: a fifth always-visible cell would advertise an
// action the browser often cannot perform.
import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import {
  promptPwaInstall,
  readInstallOffer,
  subscribeInstall,
} from "./install-availability";

export function PwaInstallButton({ onNavigate }: { onNavigate?: () => void }) {
  // False until after mount. The server has no install event, and painting a
  // button that then disappears is the dead control this exists to avoid.
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    setCanInstall(readInstallOffer());
    return subscribeInstall(() => setCanInstall(readInstallOffer()));
  }, []);

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
