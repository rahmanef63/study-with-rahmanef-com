"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { allowedTrafficPath } from "../convex/features/traffic/policy";
import { CTA_NAMES } from "../convex/features/traffic/constants";

function privacyOptOut() {
  return navigator.doNotTrack === "1" || (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true;
}
function tabSession(): string | null {
  try {
    const key = "study:public-visit-session";
    let id = sessionStorage.getItem(key);
    if (!id || !/^[a-f0-9]{16}$/.test(id)) {
      id = Array.from(crypto.getRandomValues(new Uint8Array(8)), byte => byte.toString(16).padStart(2, "0")).join("");
      sessionStorage.setItem(key, id);
    }
    return id;
  } catch { return null; }
}
function send(path: string, kind: "page" | "cta", cta?: string) {
  if (privacyOptOut()) return;
  const sessionId = tabSession();
  if (!sessionId) return;
  const params = new URLSearchParams(location.search);
  const label = (key: string) => {
    const value = params.get(key)?.toLowerCase();
    return value && /^[a-z0-9_-]{1,80}$/.test(value) ? value : undefined;
  };
  let referrerHost: string | undefined;
  try { const ref = new URL(document.referrer); if (ref.hostname !== location.hostname) referrerHost = ref.hostname.slice(0, 80); } catch { /* Direct/unknown. */ }
  const payload = { path, sessionId, kind, ...(cta ? { cta } : {}), referrerHost, utmSource: label("utm_source"), utmCampaign: label("utm_campaign"), viewport: innerWidth < 768 ? "mobile" : innerWidth < 1024 ? "tablet" : "desktop", language: navigator.language, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, localHour: new Date().getHours() };
  const body = JSON.stringify(payload);
  if (!navigator.sendBeacon?.("/api/analytics", new Blob([body], { type: "application/json" }))) void fetch("/api/analytics", { method: "POST", headers: { "content-type": "application/json" }, body, keepalive: true }).catch(() => {});
}
export function PublicTrafficRecorder() {
  const pathname = usePathname();
  const last = useRef<string | null>(null);
  useEffect(() => {
    if (!allowedTrafficPath(pathname) || privacyOptOut()) return;
    if (last.current !== pathname) { last.current = pathname; send(pathname, "page"); }
    const click = (event: MouseEvent) => {
      const element = event.target instanceof Element ? event.target.closest<HTMLElement>("[data-study-cta]") : null;
      const cta = element?.dataset.studyCta;
      if (cta && CTA_NAMES.has(cta)) send(pathname, "cta", cta);
    };
    document.addEventListener("click", click);
    return () => document.removeEventListener("click", click);
  }, [pathname]);
  return null;
}
