"use client";

// The account block — shadcn's NavUser slot, in SidebarFooter.
//
// It was four stacked rows (Profil saya, Notifikasi, Pengaturan, Changelog).
// Four rows of chrome for destinations a reader visits occasionally, permanently
// occupying the floor of the rail. As one row that opens a menu it costs 44px
// instead of ~150 and gains the thing the four rows never had: it says WHO you
// are signed in as, which is the question a footer in a dashboard exists to
// answer.
//
// It also finally puts "Keluar" in the rail. Signing out used to live only
// inside Pengaturan, which is one navigation away from every screen.
//
// It is a client island for the same reason everything membership-aware here
// is: the server has no session. It shows a SKELETON of the right height while
// auth resolves rather than rendering the signed-out shape and swapping it —
// that swap, on a slow phone, is the other thing that reads as "the page opened
// twice", and the fix is to never paint an answer we do not have yet.
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronsUpDown, LogIn, LogOut } from "lucide-react";
import { useAuthFlow } from "@/features/convex-auth";
import { ProfileAvatar, useCurrentProfile } from "@/features/profiles";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { ACCOUNT_LINKS, profileLink } from "./nav-model";
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "./sidebar-menu";

const TRIGGER =
  "pixel-press flex min-h-11 w-full items-center gap-2.5 border-2 border-transparent px-2 text-left transition-colors hover:bg-muted/50 md:min-h-10";

export function SidebarUser({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, isLoading, isAuthenticated } = useCurrentProfile();
  const { signOut } = useAuthFlow();

  // Convex auth reads localStorage, so the client's FIRST render can already
  // know the answer while the server HTML says "unknown". Holding the skeleton
  // until after mount makes the two agree (the same guard JoinButton carries,
  // for the same React #418).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted || isLoading) {
    return (
      <div className="px-2" aria-hidden>
        <Skeleton className="h-11 w-full md:h-10" />
      </div>
    );
  }

  if (!isAuthenticated || profile === null) {
    // ONE row, not a menu: /notifikasi and /pengaturan both bounce a signed-out
    // visitor, so a menu of them would be four items that all land in the same
    // place. `next` carries them back here afterwards.
    return (
      <SidebarMenu className="px-2">
        <SidebarMenuItem>
          <SidebarMenuButton
            href={`/masuk?next=${encodeURIComponent(pathname)}`}
            label="Masuk"
            icon={LogIn}
            onNavigate={onNavigate}
          />
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  const links = [profileLink(profile.username), ...ACCOUNT_LINKS];

  return (
    <div className="px-2">
      <DropdownMenu>
        <DropdownMenuTrigger className={TRIGGER}>
          <ProfileAvatar
            name={profile.displayName}
            avatarUrl={profile.avatarUrl}
            size={36}
            className="shrink-0"
          />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-medium">{profile.displayName}</span>
            <span className="truncate text-caption text-muted-foreground">@{profile.username}</span>
          </span>
          <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        </DropdownMenuTrigger>

        {/* side="top": the trigger sits on the rail's floor, so a menu opening
            downwards would render off-screen. */}
        <DropdownMenuContent
          side="top"
          align="start"
          className="w-(--radix-dropdown-menu-trigger-width) min-w-56"
        >
          <DropdownMenuLabel className="flex items-center gap-2.5">
            <ProfileAvatar
              name={profile.displayName}
              avatarUrl={profile.avatarUrl}
              size={32}
              className="shrink-0"
            />
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-medium">{profile.displayName}</span>
              <span className="truncate text-caption font-normal text-muted-foreground">
                @{profile.username}
              </span>
            </span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {links.map((link) => (
            <DropdownMenuItem key={link.key} asChild>
              <Link href={link.href} onClick={onNavigate} className="gap-2.5">
                <link.icon className="size-4 shrink-0" aria-hidden />
                {link.label}
              </Link>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onSelect={async () => {
              onNavigate?.();
              await signOut();
              // Home, not the current path: half the rail's destinations bounce
              // a signed-out reader, so staying put would be a redirect anyway.
              router.push("/");
            }}
          >
            <LogOut className="size-4 shrink-0" aria-hidden />
            Keluar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
