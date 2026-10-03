"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ADMIN_NAV_GROUPS, isAdminLinkActive } from "./admin-destinations";

/** Phone switcher. Desktop uses the same groups in the sidebar, so this row
 *  hides at md — two copies of one list is how the rail used to fork. */
export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin platform" className="grid gap-4 md:hidden">
      {ADMIN_NAV_GROUPS.map((group) => (
        <div key={group.label}>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{group.label}</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {group.links.map((link) => {
              const active = isAdminLinkActive(pathname, link);
              return (
                <li key={link.href} className="max-w-full">
                  <Link
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "inline-flex min-h-11 max-w-full items-center border px-3 text-sm",
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <span className="truncate">{link.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
