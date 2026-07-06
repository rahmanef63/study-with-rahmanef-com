"use client";

// G2/G6 (UI-UX-PRD §3): the signed-in user's home in the header — avatar
// trigger → public profile, profile settings, sign out (@convex-dev/auth).
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Settings, UserRound } from "lucide-react";
import { useAuthActions } from "@convex-dev/auth/react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { ProfileAvatar, useCurrentProfile } from "@/features/profiles";

const itemClass =
  "flex items-center gap-2 rounded-md px-2 py-2 text-sm text-foreground transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring";

export function UserMenu() {
  const router = useRouter();
  const { signOut } = useAuthActions();
  const { profile } = useCurrentProfile();

  const name = profile?.displayName ?? "Akun";
  const username = profile?.username;

  return (
    <Popover>
      <PopoverTrigger
        aria-label="Menu akun"
        className="flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:min-h-0 sm:min-w-0 sm:justify-start"
      >
        <ProfileAvatar name={name} avatarUrl={profile?.avatarUrl} size={32} />
        <span className="hidden max-w-[10rem] truncate text-sm font-medium sm:inline">
          {name}
        </span>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56 p-1.5">
        <div className="px-2 py-1.5">
          <p className="truncate text-sm font-medium">{name}</p>
          {username ? (
            <p className="truncate text-xs text-muted-foreground">@{username}</p>
          ) : null}
        </div>
        <Separator className="my-1" />
        {username ? (
          <Link href={`/u/${username}`} className={itemClass}>
            <UserRound className="size-4" /> Profil publik
          </Link>
        ) : null}
        <Link href="/pengaturan/profil" className={itemClass}>
          <Settings className="size-4" /> Pengaturan profil
        </Link>
        <Separator className="my-1" />
        <button
          type="button"
          className={`${itemClass} w-full text-left`}
          onClick={async () => {
            await signOut();
            router.push("/");
          }}
        >
          <LogOut className="size-4" /> Keluar
        </button>
      </PopoverContent>
    </Popover>
  );
}
