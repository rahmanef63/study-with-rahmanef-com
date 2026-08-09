"use client";

// The "Lainnya" sheet behind the fifth slot of the phone tab bar. It holds the
// community tabs that did not win a primary slot PLUS the two utility links the
// top row can no longer afford at 320px (Cari, Komunitas lain) — so nothing was
// dropped, it just moved one tap deeper.
//
// Built on the vendored vaul Drawer instead of a hand-rolled panel: overlay,
// focus trap, Escape, scroll lock and the drag-to-dismiss a phone user expects
// are NOT "a few lines", and vaul is already a dependency (slices/responsive-dialog).
import Link from "next/link";
import { Compass, Search, type LucideIcon } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { communityHref, type CommunityTab } from "@/lib/community";
import { cn } from "@/lib/utils";

export type MoreLink = {
  key: string;
  label: string;
  href: string;
  icon: LucideIcon;
  active: boolean;
  /** Leaves /k/<slug> entirely — visually separated from the community's own tabs. */
  external?: boolean;
};

/** Overflow tabs first (they are still community sections), then the tools. */
export function buildMoreLinks(
  overflowTabs: CommunityTab[],
  slug: string,
  iconFor: (key: string) => LucideIcon,
  isActive: (tab: CommunityTab) => boolean
): MoreLink[] {
  return [
    ...overflowTabs.map((tab) => ({
      key: tab.key,
      label: tab.label,
      href: tab.href(slug),
      icon: iconFor(tab.key),
      active: isActive(tab),
    })),
    {
      key: "cari",
      label: "Cari kelas & materi",
      href: communityHref.cari(slug),
      icon: Search,
      active: false,
      external: true,
    },
    {
      key: "komunitas",
      label: "Komunitas lain",
      href: "/komunitas",
      icon: Compass,
      active: false,
      external: true,
    },
  ];
}

export function CommunityMoreDrawer({
  open,
  onOpenChange,
  links,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  links: MoreLink[];
}) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      {/* pb clears the iOS home indicator: the sheet sits ON the viewport edge,
          the tab bar underneath it is covered by the overlay. Depends on the
          PWA agent shipping viewportFit: "cover" — without it env() is 0 and
          this degrades to the plain padding, which is still correct. */}
      <DrawerContent className="border-t-2 pb-[env(safe-area-inset-bottom,0px)]">
        <DrawerHeader className="pb-2 text-left">
          <DrawerTitle className="font-display text-xs uppercase tracking-wider">
            Lainnya
          </DrawerTitle>
        </DrawerHeader>
        <ul className="px-3 pb-4">
          {links.map((link, i) => (
            <li
              key={link.key}
              // One hairline between "sections of this community" and "leaving it".
              className={cn(i === links.findIndex((l) => l.external) && "mt-2 border-t pt-2")}
            >
              <Link
                href={link.href}
                onClick={() => onOpenChange(false)}
                aria-current={link.active ? "page" : undefined}
                className={cn(
                  "flex min-h-12 items-center gap-3 border-2 border-transparent px-3 text-sm",
                  link.active
                    ? "border-primary bg-primary/10 text-primary"
                    : "text-foreground hover:border-border"
                )}
              >
                <link.icon className="size-4 shrink-0" aria-hidden />
                <span className="min-w-0 truncate">{link.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </DrawerContent>
    </Drawer>
  );
}
