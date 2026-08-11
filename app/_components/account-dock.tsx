"use client";

// The phone dock for the account surfaces.
//
// NO MENU CELL, unlike the community dock: the account nav is four rows and all
// four fit, so a "Menu" that opened a panel listing the same four destinations
// would be a door onto the room you are standing in. The community dock needs
// one because it has eight destinations and four cells.
//
// This exists so the app has ONE phone-navigation model. These pages used to
// hide their nav behind a hamburger in the top-left corner while a community
// page docked the same kind of nav to the bottom edge — two mental models for
// one job, and the harder-to-reach of the two.
import { usePathname } from "next/navigation";
import { Users } from "lucide-react";
import { DockBar, KOMUNITAS_LINK, ACCOUNT_LINKS, isPathActive } from "@/components/shell";

/** Leaving the account area is the first cell: it is the way back to learning,
 *  and on these pages it is the most likely next tap. */
const CELLS = [{ ...KOMUNITAS_LINK, icon: Users }, ...ACCOUNT_LINKS];

export function AccountDock() {
  const pathname = usePathname();
  return (
    <DockBar
      label="Navigasi akun"
      cells={CELLS.map((link) => ({
        key: link.key,
        label: link.label,
        href: link.href,
        icon: link.icon,
        active: isPathActive(link.href, pathname, link.exact),
      }))}
    />
  );
}
