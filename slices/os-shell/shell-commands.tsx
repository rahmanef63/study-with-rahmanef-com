"use client";

// ShellCommands — contributes cross-app navigation quick actions to the ⌘K
// Spotlight palette via appshell's dynamic command registry (lib/commands).
// Client-only, no data: each command is a plain openApp() call. Renders null;
// it exists purely for the mount-effect registration + cleanup.
//
// The registry shape is { id, label, hint?, keywords?, run } — there is NO
// `section` or `icon` field, so we express the grouping through `hint`
// ("Navigasi", the right-aligned kind tag Spotlight renders) and omit icons.
import { useEffect } from "react";
import { registerCommands, toggleFocusMode, type ShellCommand } from "@/features/appshell";
import { openApp } from "./apps/_nav";

// App ids come from ./manifest (beranda/komunitas/profil/pengaturan).
const NAV_COMMANDS: ShellCommand[] = [
  {
    id: "shell-nav:beranda",
    label: "Buka Beranda",
    hint: "Navigasi",
    keywords: "home dashboard mulai belajar depan",
    run: () => openApp("beranda", "Beranda"),
  },
  {
    id: "shell-nav:komunitas",
    label: "Jelajah Komunitas",
    hint: "Navigasi",
    keywords: "community tenant jelajah explore grup",
    run: () => openApp("komunitas", "Komunitas"),
  },
  {
    id: "shell-nav:profil",
    label: "Profil saya",
    hint: "Navigasi",
    keywords: "profile akun saya me",
    run: () => openApp("profil", "Profil"),
  },
  {
    id: "shell-nav:pengaturan",
    label: "Pengaturan",
    hint: "Navigasi",
    keywords: "settings preferensi konfigurasi setelan",
    run: () => openApp("pengaturan", "Pengaturan"),
  },
  {
    id: "shell-nav:fokus",
    label: "Mode fokus (belajar)",
    hint: "Mode",
    keywords: "focus fokus belajar study dnd jangan ganggu senyap notifikasi tenang",
    run: toggleFocusMode,
  },
];

export function ShellCommands() {
  useEffect(() => registerCommands("shell-nav", NAV_COMMANDS), []);
  return null;
}
