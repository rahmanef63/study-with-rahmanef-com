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

// Warm, distinct "Editorial Warmth" glossy dock/launcher gradients.
const beranda: AppDescriptor = {
  id: "beranda",
  slug: "beranda",
  title: "Beranda",
  icon: Home,
  gradient: "linear-gradient(160deg, #c9744a 0%, #a24e2f 100%)",
  load: () => import("./apps/beranda-app"),
  defaultSize: { w: 960, h: 640 },
  pinned: true,
};

const komunitas: AppDescriptor = {
  id: "komunitas",
  slug: "komunitas",
  title: "Komunitas",
  icon: Users,
  gradient: "linear-gradient(160deg, #cd7a6a 0%, #a8503f 100%)",
  load: () => import("./apps/komunitas-app"),
  defaultSize: { w: 940, h: 660 },
  pinned: true,
};

const kelas: AppDescriptor = {
  id: "kelas",
  slug: "kelas",
  title: "Kelas",
  icon: GraduationCap,
  gradient: "linear-gradient(160deg, #d0913f 0%, #a8641f 100%)",
  load: () => import("./apps/kelas-app"),
  defaultSize: { w: 1000, h: 680 },
  noDock: true,
};

const kuis: AppDescriptor = {
  id: "kuis",
  slug: "kuis",
  title: "Kuis",
  icon: ListChecks,
  gradient: "linear-gradient(160deg, #c58a4a 0%, #8f5a22 100%)",
  load: () => import("./apps/kuis-app"),
  defaultSize: { w: 720, h: 640 },
  noDock: true,
};

const resources: AppDescriptor = {
  id: "resources",
  slug: "resources",
  title: "Resources",
  icon: Library,
  gradient: "linear-gradient(160deg, #b0764a 0%, #7d4e28 100%)",
  load: () => import("./apps/resources-app"),
  defaultSize: { w: 900, h: 640 },
  noDock: true,
};

const pengumuman: AppDescriptor = {
  id: "pengumuman",
  slug: "pengumuman",
  title: "Pengumuman",
  icon: Megaphone,
  gradient: "linear-gradient(160deg, #d47a55 0%, #b0472f 100%)",
  load: () => import("./apps/pengumuman-app"),
  defaultSize: { w: 740, h: 640 },
  noDock: true,
};

const kelola: AppDescriptor = {
  id: "kelola",
  slug: "kelola",
  title: "Kelola",
  icon: SlidersHorizontal,
  gradient: "linear-gradient(160deg, #8a7a68 0%, #56463a 100%)",
  load: () => import("./apps/kelola-app"),
  defaultSize: { w: 1060, h: 700 },
  noDock: true,
};

const profil: AppDescriptor = {
  id: "profil",
  slug: "profil",
  title: "Profil",
  icon: UserRound,
  gradient: "linear-gradient(160deg, #c07a86 0%, #9a4f5c 100%)",
  load: () => import("./apps/profil-app"),
  defaultSize: { w: 820, h: 660 },
  pinned: true,
};

const pengaturan: AppDescriptor = {
  id: "pengaturan",
  slug: "pengaturan",
  title: "Pengaturan",
  icon: Settings,
  gradient: "linear-gradient(160deg, #96897a 0%, #5f5346 100%)",
  load: () => import("./apps/pengaturan-app"),
  defaultSize: { w: 640, h: 620 },
  pinned: true,
};

const masuk: AppDescriptor = {
  id: "masuk",
  slug: "masuk",
  title: "Masuk",
  icon: LogIn,
  gradient: "linear-gradient(160deg, #c9744a 0%, #9a4a2c 100%)",
  load: () => import("./apps/masuk-app"),
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
  features: DEFAULT_FEATURES,
  persistKey: "study-with:os",
  capabilities: editorialCapabilities,
  // Full-desktop: mirror the focused app to the URL (History API). Paired with
  // the app/[[...slug]] catch-all that renders the desktop for every path.
  routing: true,
};
