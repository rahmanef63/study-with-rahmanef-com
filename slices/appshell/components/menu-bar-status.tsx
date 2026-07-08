"use client";

import { useEffect, useState } from "react";
import { Activity, Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCpuPercent } from "../registry/capabilities";
import { toggleSpotlight, toggleInspector, toggleNotificationCenter } from "../lib/store";
import { useNotifications } from "../lib/toast";
import { Slot } from "../registry/feature-registry";
import { ThemePresetSwitcher } from "@/features/theme-presets"; // [study-with fork] theme + preset picker in the menu bar

// Right cluster of the menu bar: cpu · spotlight · inspector · theme · clock.
export function StatusCluster() {
  const cpu = useCpuPercent();
  const clock = useClock();
  const unread = useNotifications().some((n) => !n.read);

  return (
    <div className="ml-auto flex items-center gap-0.5 text-muted-foreground">
      {cpu != null && (
        <span className="flex items-center gap-1 rounded-md px-2 py-0.5 tabular-nums">
          <Activity className="size-3.5" />
          {cpu}%
        </span>
      )}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Spotlight (⌘K)"
        onClick={toggleSpotlight}
        className="h-auto grid size-6 place-items-center rounded-md hover:bg-[var(--hover-strong)]"
      >
        <Search className="size-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="AI Inspector (⌘I)"
        onClick={toggleInspector}
        className="h-auto grid size-6 place-items-center rounded-md hover:bg-[var(--hover-strong)]"
      >
        <Sparkles className="size-4" />
      </Button>
      {/* [study-with fork] theme mode + color-preset picker (replaces the plain
          light/dark toggle — the popover has mode tabs + all presets). */}
      <ThemePresetSwitcher triggerClassName="h-6 gap-0.5 px-1" />
      {/* Host-contributed trailing items (e.g. macOS Control Center). */}
      <Slot region="menuBarStatus" />
      {/* Clock → Notification Center; dot = unread. */}
      <Button
        type="button"
        variant="ghost"
        aria-label="Notification Center"
        onClick={toggleNotificationCenter}
        className="h-auto relative flex items-center rounded-md px-1.5 py-0.5 font-semibold tabular-nums text-foreground hover:bg-[var(--hover-strong)]"
      >
        {clock}
        {unread && <span className="absolute right-0.5 top-0.5 size-1.5 rounded-full bg-primary" />}
      </Button>
    </div>
  );
}

function useClock() {
  const [now, setNow] = useState("");
  useEffect(() => {
    const tick = () =>
      setNow(
        new Date().toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" }) +
          "  " +
          new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
      );
    tick();
    const t = setInterval(tick, 20000);
    return () => clearInterval(t);
  }, []);
  return now;
}
