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
  GraduationCap,
  Home,
  Library,
  ListChecks,
  LogIn,
  Megaphone,
  Settings,
  SlidersHorizontal,
  UserRound,
  Users,
} from "lucide-react";
import { LogoMark } from "@/components/brand/logo";
import { editorialCapabilities } from "./capabilities";
import { learningWidgetsFeature } from "./learning-widgets";
import { accountFeature } from "./account";
import { shellSwitchFeature } from "./shell-switch";
import { pinsFeature } from "./pins";
import { scrollize } from "./app-scroll";

// Distinct per-feature hues so icons are recognizable at a glance (the app chrome
// stays Editorial Warmth; icon tiles vary like any real OS icon set).
const beranda: AppDescriptor = {
  id: "beranda",
  slug: "beranda",
  title: "Beranda",
  icon: Home,
  gradient: "linear-gradient(160deg, #d98a5c 0%, #b3552f 100%)",
  load: scrollize(() => import("./apps/beranda-app")),
  defaultSize: { w: 960, h: 640 },
  pinned: true,
};

const komunitas: AppDescriptor = {
  id: "komunitas",
  slug: "komunitas",
  title: "Komunitas",
  icon: Users,
  gradient: "linear-gradient(160deg, #d76b7f 0%, #a83f56 100%)",
  load: scrollize(() => import("./apps/komunitas-app")),
  defaultSize: { w: 940, h: 660 },
  pinned: true,
};

const kelas: AppDescriptor = {
  id: "kelas",
  slug: "kelas",
  title: "Kelas",
  icon: GraduationCap,
  gradient: "linear-gradient(160deg, #e0a63f 0%, #b3781a 100%)",
  load: scrollize(() => import("./apps/kelas-app")),
  defaultSize: { w: 1000, h: 680 },
  noDock: true,
};

const kuis: AppDescriptor = {
  id: "kuis",
  slug: "kuis",
  title: "Kuis",
  icon: ListChecks,
  gradient: "linear-gradient(160deg, #4fae74 0%, #2f8551 100%)",
  load: scrollize(() => import("./apps/kuis-app")),
  defaultSize: { w: 720, h: 640 },
  noDock: true,
};

const resources: AppDescriptor = {
  id: "resources",
  slug: "resources",
  title: "Resources",
  icon: Library,
  gradient: "linear-gradient(160deg, #4a9fb0 0%, #2f7385 100%)",
  load: scrollize(() => import("./apps/resources-app")),
  defaultSize: { w: 900, h: 640 },
  noDock: true,
};

const pengumuman: AppDescriptor = {
  id: "pengumuman",
  slug: "pengumuman",
  title: "Pengumuman",
  icon: Megaphone,
  gradient: "linear-gradient(160deg, #e07a4a 0%, #c04a2a 100%)",
  load: scrollize(() => import("./apps/pengumuman-app")),
  defaultSize: { w: 740, h: 640 },
  noDock: true,
};

const kelola: AppDescriptor = {
  id: "kelola",
  slug: "kelola",
  title: "Kelola",
  icon: SlidersHorizontal,
  gradient: "linear-gradient(160deg, #6b7aa8 0%, #45507a 100%)",
  load: scrollize(() => import("./apps/kelola-app")),
  defaultSize: { w: 1060, h: 700 },
  noDock: true,
};

const profil: AppDescriptor = {
  id: "profil",
  slug: "profil",
  title: "Profil",
  icon: UserRound,
  gradient: "linear-gradient(160deg, #a86bb0 0%, #7a3f85 100%)",
  load: scrollize(() => import("./apps/profil-app")),
  defaultSize: { w: 820, h: 660 },
  pinned: true,
};

const pengaturan: AppDescriptor = {
  id: "pengaturan",
  slug: "pengaturan",
  title: "Pengaturan",
  icon: Settings,
  gradient: "linear-gradient(160deg, #8a8a8a 0%, #565656 100%)",
  load: scrollize(() => import("./apps/pengaturan-app")),
  defaultSize: { w: 640, h: 620 },
  pinned: true,
};

const masuk: AppDescriptor = {
  id: "masuk",
  slug: "masuk",
  title: "Masuk",
  icon: LogIn,
  gradient: "linear-gradient(160deg, #6b74c0 0%, #454a92 100%)",
  load: scrollize(() => import("./apps/masuk-app")),
  defaultSize: { w: 460, h: 560 },
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
  kelola,
  profil,
  pengaturan,
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
