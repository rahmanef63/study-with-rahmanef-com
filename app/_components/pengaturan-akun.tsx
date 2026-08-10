"use client";

// Akun — who is signed in, plus the sign-out that actually ends the session.
// Ported from the deleted os-shell account control; the avatar/menu-bar half of
// that file died with the desktop shell, this page is now the only sign-out.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CircleUser, LogIn, LogOut, ShieldCheck } from "lucide-react";
import { useAuthFlow } from "@/features/convex-auth";
import { useCurrentProfile } from "@/features/profiles";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

function Avatar({ url, className }: { url: string | null; className?: string }) {
 if (url) {
    // eslint-disable-next-line @next/next/no-img-element -- external OAuth avatar, no next/image
 return <img src={url} alt="" className={cn("object-cover", className)} />;
  }
 return (
    <span
 className={cn("grid place-items-center bg-primary/15 text-primary", className)}
    >
      <CircleUser className="size-[62%]" aria-hidden />
    </span>
  );
}

export function PengaturanAkun() {
 const { profile, isAuthenticated, isLoading } = useCurrentProfile();
 const { signOut } = useAuthFlow();
 const router = useRouter();

 if (isLoading) {
 return (
      <div className="flex flex-col gap-3" aria-busy="true">
        <Skeleton className="h-16 w-full " />
      </div>
    );
  }

 if (!isAuthenticated) {
 return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <CircleUser aria-hidden />
          </EmptyMedia>
          <EmptyTitle className="font-display">Belum masuk</EmptyTitle>
          <EmptyDescription className="text-pretty">
            Masuk untuk melihat sesi akun dan keluar kapan saja.
          </EmptyDescription>
        </EmptyHeader>
        <Button asChild className="min-h-11">
          <Link href="/masuk?next=%2Fpengaturan">
            <LogIn className="size-4" aria-hidden /> Masuk
          </Link>
        </Button>
      </Empty>
    );
  }

 const name = profile?.displayName ?? "Akun";

 return (
    <div className="flex flex-wrap items-center gap-3 border bg-card p-3">
      <Avatar url={profile?.avatarUrl ?? null} className="size-11" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{name}</p>
        {profile?.username ? (
          <p className="truncate text-xs text-muted-foreground">@{profile.username}</p>
        ) : null}
      </div>
      {profile?.isPlatformAdmin ? (
        <span className="inline-flex shrink-0 items-center gap-1 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
          <ShieldCheck className="size-3.5" aria-hidden /> Admin
        </span>
      ) : null}
      <Button
 variant="outline"
 size="sm"
 className="shrink-0 gap-1.5"
 onClick={async () => {
 await signOut();
 toast("Kamu sudah keluar.");
          // Members-only views cached in this tree still hold the old session's
          // data until the router re-renders them as anonymous.
 router.refresh();
        }}
      >
        <LogOut className="size-4" aria-hidden /> Keluar
      </Button>
    </div>
  );
}
