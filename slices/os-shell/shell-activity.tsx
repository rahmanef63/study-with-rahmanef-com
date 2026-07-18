"use client";
// ShellActivity — the desktop's "live" nerve: while the user is signed in it
// watches every community they belong to and, when a NEW announcement lands
// after mount, fires a transient toast AND badges the dockable Komunitas icon
// with the aggregate unread count. Renders null — it's a pure side-effect
// coordinator, mounted as a SIBLING after <AppShell/> in os-root (same slot the
// BootBeranda effect uses), so it never draws chrome of its own.
//
// Why one hidden child per community: React hooks can't be called in a loop, so
// we can't `useAnnouncements(tenantId)` once per tenant inside this component.
// Instead we map the community list → one <TenantAnnouncementWatcher/> child
// each; every child owns its own reactive announcements subscription and reports
// its unread count into a shared module counter that drives the badge.
import { useEffect, useRef, useState } from "react";
import { useConvexAuth } from "convex/react";
import { setBadge, toast } from "@/features/appshell";
// PERF: light sub-barrels — this file is eager shell chrome; the full slice
// barrels would drag every view into the initial JS chunk.
import { useMyCommunities, type MyCommunity } from "@/features/tenants/hooks";
import { useAnnouncements } from "@/features/announcements/hooks";
import { openApp } from "./apps/_nav";

// Per-tenant "high-water mark": the newest announcement time we've already
// accounted for. Persisted so a reload doesn't re-toast (or forget) history.
const SEEN_PREFIX = "study-with:seen:ann:";
// The dockable icon that shows the aggregate badge. `pengumuman` is noDock, so
// badging it would never render — the count lives on Komunitas, the toast's
// "Buka" action deep-links into pengumuman for the specific community.
const BADGE_APP = "komunitas";
const OPEN_APP = "pengumuman";

function readSeen(tenantId: string): number | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SEEN_PREFIX + tenantId);
    if (raw === null) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null; // private mode / disabled storage — degrade to no-persist
  }
}

function writeSeen(tenantId: string, ts: number): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SEEN_PREFIX + tenantId, String(ts));
  } catch {
    /* quota / disabled — the badge simply recomputes next session */
  }
}

// ── Aggregate unread badge (module-singleton; ShellActivity mounts once) ──────
// Each watcher publishes its own unread count here; we sum + write the Komunitas
// badge. The toast module ALSO badges Komunitas off its unread notification log
// (because we pass appId), and the two agree by construction — every toast we
// fire is exactly one unread Komunitas notification — so whichever writes last
// shows the same number.
const unreadByTenant = new Map<string, number>();
function pushBadge(): void {
  let total = 0;
  for (const n of unreadByTenant.values()) total += n;
  setBadge(BADGE_APP, total > 0 ? { count: total } : null);
}
function reportUnread(tenantId: string, count: number): void {
  if (count > 0) unreadByTenant.set(tenantId, count);
  else unreadByTenant.delete(tenantId);
  pushBadge();
}

/** Hidden per-community watcher: subscribes to that tenant's announcements,
 *  toasts brand-new ones, and feeds its unread count into the shared badge. */
function TenantAnnouncementWatcher({ community }: { community: MyCommunity }) {
  const announcements = useAnnouncements(community._id);
  // Baseline high-water mark for THIS tenant + whether we've seeded it yet.
  const seenRef = useRef<number | null>(null);
  const initRef = useRef(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (announcements === undefined) return; // loading — defensive, never throw
    const newest = announcements.length
      ? Math.max(...announcements.map((a) => a.createdAt))
      : 0;

    // First data pass: establish the baseline. Seed = a stored last-seen from a
    // prior session, else `newest` so pre-existing history is NEVER toasted.
    // Anything newer than a stored baseline is away-time backlog: surfaced on
    // the badge, but not toasted (toasts are for live, post-mount arrivals).
    if (!initRef.current) {
      initRef.current = true;
      const stored = readSeen(community._id);
      const baseline = stored ?? newest;
      seenRef.current = baseline;
      if (stored === null) writeSeen(community._id, newest);
      const backlog = announcements.filter((a) => a.createdAt > baseline).length;
      if (backlog > 0) setUnread(backlog);
      return;
    }

    // Live pass: anything strictly newer than the baseline just arrived.
    const baseline = seenRef.current ?? 0;
    const fresh = announcements
      .filter((a) => a.createdAt > baseline)
      .sort((a, b) => a.createdAt - b.createdAt); // oldest-first toast order
    if (fresh.length === 0) return;

    for (const _a of fresh) {
      toast(`Pengumuman baru di ${community.name}`, {
        appId: BADGE_APP,
        action: {
          label: "Buka",
          onClick: () => openApp(OPEN_APP, community.name, [community.slug]),
        },
      });
    }
    setUnread((u) => u + fresh.length);
    const bumped = Math.max(baseline, ...fresh.map((a) => a.createdAt));
    seenRef.current = bumped;
    writeSeen(community._id, bumped); // bump last-seen past what we toasted
  }, [announcements, community._id, community.name, community.slug]);

  // Publish this tenant's unread into the aggregate badge as it changes…
  useEffect(() => {
    reportUnread(community._id, unread);
  }, [community._id, unread]);

  // …and retract it when this community drops off the list (user left / logout).
  useEffect(() => {
    const id = community._id;
    return () => reportUnread(id, 0);
  }, [community._id]);

  return null;
}

/** Mount once, beside <AppShell/>. No-op when logged out. */
export function ShellActivity() {
  const { isAuthenticated } = useConvexAuth();
  const communities = useMyCommunities();

  if (!isAuthenticated) return null; // logged-out → no watchers, no badge
  return (
    <>
      {communities?.map((c) => (
        <TenantAnnouncementWatcher key={c._id} community={c} />
      ))}
    </>
  );
}
