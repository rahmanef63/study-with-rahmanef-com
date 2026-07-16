// os-shell manifest — the ONE place this app's brand + OS app set + shell
// features are declared. appshell core imports none of it; it's injected via
// <AppShell manifest>. Add an app = one AppDescriptor entry (open/closed).
//
// Single-instance by design (no `multi`): re-opening an app with a fresh payload
// swaps the existing window's payload + refocuses (see appshell openWindow), so a
// different course/community reuses one window instead of cluttering the desktop.
// `noDock` apps are payload-driven / contextual (kelas, kuis, resources,
// pengumuman, kelola open FROM another app; masuk only when logged-out) — they'd
// show an empty "pick one" state if launched bare, so they stay out of the dock
// and are reached via their launcher entry or a sibling app's action.
import type { AppDescriptor, Brand, ShellManifest } from "@/features/appshell";
import { DEFAULT_FEATURES } from "@/features/appshell";
import {
  Award,
  Bell,
  BookOpen,
  Sparkles,
  GraduationCap,
  History,
  Home,
  Library,
  ListChecks,
  LogIn,
  Megaphone,
  Search,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  UserRound,
  Users,
} from "lucide-react";
import { LogoMark } from "@/components/brand/logo";
import { editorialCapabilities } from "./capabilities";
import { learningWidgetsFeature } from "./learning-widgets";
import { accountFeature } from "./account";
import { notificationsStatusFeature } from "./notifications-status";
import { shellSwitchFeature } from "./shell-switch";
import { pinsFeature } from "./pins";
import { scrollize } from "./app-scroll";

// Feature-icon tints ride the active theme preset's --chart-1..5 ramp — DYNAMIC:
// switch preset (rupa/modern-minimal/emerald/…) and every icon re-skins. Each app
// gets a distinct chart hue; the gradient darkens the base for the glossy tile.
const CHART = (n: 1 | 2 | 3 | 4 | 5) =>
  `linear-gradient(160deg, var(--chart-${n}), color-mix(in oklab, var(--chart-${n}) 68%, #000))`;
const beranda: AppDescriptor = {
  id: "beranda",
  slug: "beranda",
  title: "Beranda",
  icon: Home,
  gradient: CHART(1),
  load: scrollize(() => import("./apps/beranda-app")),
  defaultSize: { w: 960, h: 640 },
  pinned: true,
};

const komunitas: AppDescriptor = {
  id: "komunitas",
  slug: "komunitas",
  title: "Komunitas",
  icon: Users,
  gradient: CHART(2),
  load: scrollize(() => import("./apps/komunitas-app")),
  defaultSize: { w: 940, h: 660 },
  pinned: true,
};

const kelas: AppDescriptor = {
  id: "kelas",
  slug: "kelas",
  title: "Kelas",
  icon: GraduationCap,
  gradient: CHART(3),
  load: scrollize(() => import("./apps/kelas-app")),
  defaultSize: { w: 1000, h: 680 },
  noDock: true,
};

const kuis: AppDescriptor = {
  id: "kuis",
  slug: "kuis",
  title: "Kuis",
  icon: ListChecks,
  gradient: CHART(4),
  load: scrollize(() => import("./apps/kuis-app")),
  defaultSize: { w: 720, h: 640 },
  noDock: true,
};

const resources: AppDescriptor = {
  id: "resources",
  slug: "resources",
  title: "Resources",
  icon: Library,
  gradient: CHART(5),
  load: scrollize(() => import("./apps/resources-app")),
  defaultSize: { w: 900, h: 640 },
  noDock: true,
};

const pengumuman: AppDescriptor = {
  id: "pengumuman",
  slug: "pengumuman",
  title: "Pengumuman",
  icon: Megaphone,
  gradient: CHART(1),
  load: scrollize(() => import("./apps/pengumuman-app")),
  defaultSize: { w: 740, h: 640 },
  noDock: true,
};

const kelola: AppDescriptor = {
  id: "kelola",
  slug: "kelola",
  title: "Kelola",
  icon: SlidersHorizontal,
  gradient: CHART(2),
  load: scrollize(() => import("./apps/kelola-app")),
  defaultSize: { w: 1060, h: 700 },
  noDock: true,
};

const profil: AppDescriptor = {
  id: "profil",
  slug: "profil",
  title: "Profil",
  icon: UserRound,
  gradient: CHART(3),
  load: scrollize(() => import("./apps/profil-app")),
  defaultSize: { w: 820, h: 660 },
  pinned: true,
};

const pengaturan: AppDescriptor = {
  id: "pengaturan",
  slug: "pengaturan",
  title: "Pengaturan",
  icon: Settings,
  gradient: CHART(4),
  load: scrollize(() => import("./apps/pengaturan-app")),
  defaultSize: { w: 640, h: 620 },
  pinned: true,
};

const masuk: AppDescriptor = {
  id: "masuk",
  slug: "masuk",
  title: "Masuk",
  icon: LogIn,
  gradient: CHART(5),
  load: scrollize(() => import("./apps/masuk-app")),
  defaultSize: { w: 460, h: 560 },
  noDock: true,
};

// Wave v1.6 (#35) — Alfa, the AI study assistant. PINNED: dock-level presence,
// it works bare (general chat) AND with a payload (/asisten/<lessonId>).
const asisten: AppDescriptor = {
  id: "asisten",
  slug: "asisten",
  title: "Alfa",
  icon: Sparkles,
  gradient: CHART(3),
  load: scrollize(() => import("./apps/asisten-app")),
  defaultSize: { w: 680, h: 700 },
  pinned: true,
};

// Wave v1.3 (#27) — payload-driven/contextual, so noDock like their siblings.
const cari: AppDescriptor = {
  id: "cari",
  slug: "cari",
  title: "Cari",
  icon: Search,
  gradient: CHART(4),
  load: scrollize(() => import("./apps/cari-app")),
  defaultSize: { w: 720, h: 640 },
  noDock: true,
};

const notifikasi: AppDescriptor = {
  id: "notifikasi",
  slug: "notifikasi",
  title: "Notifikasi",
  icon: Bell,
  gradient: CHART(1),
  load: scrollize(() => import("./apps/notifikasi-app")),
  defaultSize: { w: 640, h: 640 },
  noDock: true,
};

const sertifikat: AppDescriptor = {
  id: "sertifikat",
  slug: "sertifikat",
  title: "Sertifikat",
  icon: Award,
  gradient: CHART(5),
  load: scrollize(() => import("./apps/sertifikat-app")),
  defaultSize: { w: 760, h: 680 },
  noDock: true,
};

// Platform group (sidebar "Platform" → Docs · Changelog). Static content apps,
// launcher-/sidebar-reached (noDock).
const docs: AppDescriptor = {
  id: "docs",
  slug: "docs",
  title: "Docs",
  icon: BookOpen,
  gradient: CHART(5),
  load: scrollize(() => import("./apps/docs-app")),
  defaultSize: { w: 820, h: 660 },
  noDock: true,
};

const changelog: AppDescriptor = {
  id: "changelog",
  slug: "changelog",
  title: "Changelog",
  icon: History,
  gradient: CHART(3),
  load: scrollize(() => import("./apps/changelog-app")),
  defaultSize: { w: 820, h: 680 },
  noDock: true,
};

// Platform-admin console (super admin only). Hidden from the app registry for
// non-admins by os-root; server + app-content gate it too. See admin-app.tsx.
const admin: AppDescriptor = {
  id: "admin",
  slug: "admin",
  title: "Admin",
  icon: ShieldCheck,
  gradient: CHART(2),
  load: scrollize(() => import("./apps/admin-app")),
  defaultSize: { w: 940, h: 720 },
  noDock: true,
};

// Dock order = array order (dock shows non-noDock: beranda · komunitas · profil ·
// pengaturan). The rest are launcher-/context-reachable.
export const APPS: AppDescriptor[] = [
  beranda,
  komunitas,
  kelas,
  kuis,
  resources,
  pengumuman,
  cari,
  asisten,
  kelola,
  profil,
  notifikasi,
  sertifikat,
  pengaturan,
  docs,
  changelog,
  admin,
  masuk,
];

export const BRAND: Brand = {
  name: "belajar·with·rahmanef",
  logo: <LogoMark className="size-4 text-primary" />,
  idleAppName: "Beranda",
};

export const shellManifest: ShellManifest = {
  brand: BRAND,
  apps: APPS,
  // Swap appshell's dead system-stats widgets for our learning widgets (resume
  // courses); keep the rest of DEFAULT_FEATURES (search, notifications, …). Append
  // accountFeature to fill the macOS menu-bar account slot (empty in stock appshell).
  features: [
    ...DEFAULT_FEATURES.filter((f) => f.id !== "widgets"),
    learningWidgetsFeature,
    notificationsStatusFeature, // bell BEFORE the avatar in menuBarStatus
    accountFeature,
    shellSwitchFeature,
    pinsFeature,
  ],
  persistKey: "study-with:os",
  capabilities: editorialCapabilities,
  // Full-desktop: mirror the focused app to the URL (History API). Paired with
  // the app/[[...slug]] catch-all that renders the desktop for every path.
  routing: true,
};
