"use client";

import { useEffect, useRef } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";

const POLL_MS = 60_000;

export function VersionWatcher() {
  const seen = useRef<string | null>(null);
  const shown = useRef(false);

  useEffect(() => {
    async function check() {
      try {
        const response = await fetch("/api/version", { cache: "no-store" });
        if (!response.ok) return;
        const { id } = (await response.json()) as { id?: string };
        if (!id) return;
        if (seen.current === null) {
          seen.current = id;
          return;
        }
        if (id !== seen.current && !shown.current) {
          shown.current = true;
          toast.message("Versi baru tersedia", {
            description: "Muat ulang untuk menggunakan update terbaru.",
            duration: Infinity,
            icon: <RefreshCw className="size-4" />,
            action: { label: "Muat ulang", onClick: hardReload },
          });
        }
      } catch {
        // Retry on the next interval or focus event.
      }
    }

    void check();
    const interval = window.setInterval(check, POLL_MS);
    window.addEventListener("focus", check);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", check);
    };
  }, []);

  return null;
}

function hardReload() {
  const url = new URL(window.location.href);
  url.searchParams.set("_v", String(Date.now()));
  window.location.replace(url.toString());
}
