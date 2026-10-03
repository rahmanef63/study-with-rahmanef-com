"use client";

// The compact bar's title on the account surfaces.
//
// The ONLY thing that was ever account-specific about the top bar: a community
// bar shows the community's name, and out here there is no community, so the
// page has to name itself. Everything else — the geometry, the safe-area
// padding, the md:hidden — is <ShellTopBar/>, which this passes a string to.
import { usePathname } from "next/navigation";
import { ShellTopBar } from "@/components/shell";

const TITLES: Record<string, string> = {
  "/komunitas": "Komunitas",
  "/notifikasi": "Notifikasi",
  "/changelog": "Changelog",
};

export function AccountTitle() {
  const pathname = usePathname();
  // A profile is /u/<username>, so it cannot be a map key. Admin and settings
  // have nested routes; an exact map would label those bars "Belajar".
  const title = pathname.startsWith("/u/")
    ? "Profil"
    : pathname === "/admin" || pathname.startsWith("/admin/")
      ? "Admin platform"
      : pathname === "/pengaturan" || pathname.startsWith("/pengaturan/")
        ? "Pengaturan"
        : (TITLES[pathname] ?? "Belajar");
  return <ShellTopBar title={title} />;
}
