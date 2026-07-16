// Sidebar navigation groups — the SINGLE source of truth for how the Dashboard
// shell's sidebar is organized (collapsible groups, "normal dashboard" style).
// The generic appshell never hardcodes our app ids (appshell/lib/types.ts), so
// this project layer owns the grouping. Add an app to a group here; anything left
// ungrouped falls into "Lainnya" so a new app never silently vanishes.
import type { AppDescriptor } from "@/features/appshell";

export const NAV_GROUPS: { label: string; appIds: string[] }[] = [
  { label: "Ruang", appIds: ["beranda", "komunitas"] },
  // "asisten" sengaja TIDAK terdaftar: app-nya diparkir (PARKED_APP_IDS di
  // os-root.tsx) — begitu diaktifkan, tambahkan kembali di sini.
  { label: "Belajar", appIds: ["kelas", "kuis", "cari", "resources", "pengumuman", "sertifikat"] },
  { label: "Kelola", appIds: ["kelola"] },
  { label: "Akun", appIds: ["profil", "notifikasi", "pengaturan"] },
  // `admin` resolves only for platform admins — os-root filters it out of the
  // app registry for everyone else, so groupApps() simply won't find it.
  { label: "Platform", appIds: ["docs", "changelog", "admin"] },
];

export type NavGroup = { label: string; apps: AppDescriptor[] };

/** Resolve NAV_GROUPS against the live app list: keeps declared order, drops
 *  empty groups, and appends a "Lainnya" group for any app not placed above. */
export function groupApps(apps: AppDescriptor[]): NavGroup[] {
  const byId = new Map(apps.map((a) => [a.id, a]));
  const placed = new Set<string>();
  const groups: NavGroup[] = [];
  for (const g of NAV_GROUPS) {
    const gApps = g.appIds
      .map((id) => byId.get(id))
      .filter((a): a is AppDescriptor => Boolean(a));
    gApps.forEach((a) => placed.add(a.id));
    if (gApps.length) groups.push({ label: g.label, apps: gApps });
  }
  const leftover = apps.filter((a) => !placed.has(a.id));
  if (leftover.length) groups.push({ label: "Lainnya", apps: leftover });
  return groups;
}
