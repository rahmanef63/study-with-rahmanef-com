import { AccountShell } from "../_components/account-shell";

// (akun) — THE ROUTE GROUP THAT IS THE LINE.
//
// Everything inside this folder gets the dashboard sidebar; everything left at
// app/ root deliberately does not. The grouping is not tidiness — it is the one
// mechanism that keeps ONE rail instance mounted while you move between
// /komunitas, /notifikasi and /pengaturan.
//
// MEASURED, which is why the first attempt (a layout.tsx per segment) was
// thrown away: three sibling layouts are three React trees, so a client
// navigation from /pengaturan to /komunitas replaced the <aside> with a
// different DOM node (`railSameNode: false`, 3 detach events at 4x CPU
// throttle). A fresh node means <ShellAccountNav/> remounts, its `mounted`
// guard resets, and a signed-in reader's account rows repaint as three
// skeletons for a frame — the chrome flickering on every hop, which is the
// exact class of defect this whole rebuild exists to remove. One layout, one
// mount, and only the content pane swaps.
//
// The group name never appears in a URL: these routes stay /komunitas,
// /notifikasi and /pengaturan.
//
// WHAT IS NOT IN HERE, AND MUST NOT BE MOVED IN — see the scope block in
// app/_components/account-shell.tsx before you add a folder.
export default function AkunLayout({ children }: { children: React.ReactNode }) {
  return <AccountShell>{children}</AccountShell>;
}
