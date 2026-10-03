"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useAuthToken } from "@convex-dev/auth/react";
import { allowedUserActivityPath } from "../convex/features/userAnalytics/policy";
import { learningClickTarget, learningEntrySource } from "@/lib/user-activity-client";

function privacyOptOut() {
  return navigator.doNotTrack === "1" || (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true;
}
export function UserActivityRecorder() {
  const pathname = usePathname();
  const token = useAuthToken();
  const last = useRef<string | null>(null);
  useEffect(() => {
    if (privacyOptOut()) return;
    const readSource = () => {
      try { return learningEntrySource(location.search, document.referrer, location.origin, sessionStorage); } catch { return {}; }
    };
    readSource(); // Capture the entry before authentication redirects.
    if (!token) { last.current = null; return; }
    if (!allowedUserActivityPath(pathname)) return;
    const send = (kind: "page" | "click", target?: string) => {
      if (privacyOptOut()) return;
      void fetch("/api/analytics/user", { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify({ kind, path: pathname, ...(target ? { target } : {}), ...readSource(),
          viewport: innerWidth < 768 ? "mobile" : innerWidth < 1024 ? "tablet" : "desktop" }),
        keepalive: true,
      }).catch(() => {});
    };
    if (last.current !== pathname) { last.current = pathname; send("page"); }
    const click = (event: MouseEvent) => {
      if (event.button > 1) return;
      const anchor = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
      if (!anchor || anchor.hasAttribute("download") || anchor.getAttribute("aria-disabled") === "true") return;
      const target = learningClickTarget(anchor.href, location.origin);
      if (target) send("click", target);
    };
    document.addEventListener("click", click);
    document.addEventListener("auxclick", click);
    return () => { document.removeEventListener("click", click); document.removeEventListener("auxclick", click); };
  }, [pathname, token]);
  return null;
}
