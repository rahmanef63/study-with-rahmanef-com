"use client";

// The account section of the rail — the bottom third, below the community's
// own destinations.
//
// It is a client island for the same reason everything membership-aware here
// is: the server has no session. It shows a SKELETON of the right height while
// auth resolves rather than rendering the signed-out shape and swapping it —
// that swap, on a slow phone, is the other thing that reads as "the page opened
// twice", and the fix is to never paint an answer we do not have yet.
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LogIn } from "lucide-react";
import { useCurrentProfile } from "@/features/profiles";
import { Skeleton } from "@/components/ui/skeleton";
import { SidebarGroup } from "./sidebar";
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "./sidebar-menu";
import { ACCOUNT_LINKS, isPathActive, profileLink } from "./nav-model";

function Rows({ count }: { count: number }) {
  return (
    <SidebarMenuItem aria-hidden className="space-y-0.5 px-3 py-1">
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} className="h-9 w-full" />
      ))}
    </SidebarMenuItem>
  );
}

export function ShellAccountNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { profile, isLoading, isAuthenticated } = useCurrentProfile();

  // Convex auth reads localStorage, so the client's FIRST render can already
  // know the answer while the server HTML says "unknown". Holding the skeleton
  // until after mount makes the two agree (the same guard JoinButton carries,
  // for the same React #418).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const links = profile === null ? ACCOUNT_LINKS : [profileLink(profile.username), ...ACCOUNT_LINKS];

  return (
    <SidebarGroup label="Akun" heading="Akun">
      <SidebarMenu>
      {!mounted || isLoading ? (
        <Rows count={3} />
      ) : isAuthenticated ? (
        links.map((link) => (
          <SidebarMenuItem key={link.key}>
            <SidebarMenuButton
              href={link.href}
              label={link.label}
              icon={link.icon}
              isActive={isPathActive(link.href, pathname, link.exact)}
              onNavigate={onNavigate}
            />
          </SidebarMenuItem>
        ))
      ) : (
        <SidebarMenuItem>
          {/* One row, not four: /notifikasi and /pengaturan both bounce a
              signed-out visitor, so listing them would be four taps that all
              land in the same place. */}
          <SidebarMenuButton
            href={`/masuk?next=${encodeURIComponent(pathname)}`}
            label="Masuk"
            icon={LogIn}
            onNavigate={onNavigate}
          />
        </SidebarMenuItem>
      )}
      </SidebarMenu>
    </SidebarGroup>
  );
}
