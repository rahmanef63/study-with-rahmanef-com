// The utility row above the community title: home, Cari, Komunitas lain.
//
// DESKTOP ONLY (md and up). On a phone it cost 48px — 6% of the screen — to
// repeat the wordmark of the app you are already inside and to duplicate two
// links that the bottom bar's "Lainnya" sheet already holds. Below md the
// community name in the nav bar is the only orientation a learner needs.
import Link from "next/link";
import { Search } from "lucide-react";
import { LogoMark } from "@/components/brand/logo";
import { communityHref } from "@/lib/community";

export function CommunityBrandRow({
  slug,
  className,
}: {
  slug: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="flex min-h-12 items-center justify-between gap-3 text-sm">
        <Link href="/" className="inline-flex items-center gap-2 font-medium">
          <LogoMark className="size-4 shrink-0 text-primary" aria-hidden />
          <span className="font-display text-[0.6rem] uppercase tracking-wider text-muted-foreground">
            belajar·with·rahmanef
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href={communityHref.cari(slug)}
            className="inline-flex min-h-11 items-center gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <Search className="size-3.5 shrink-0" aria-hidden />
            Cari
          </Link>
          <Link
            href="/komunitas"
            className="inline-flex min-h-11 items-center text-muted-foreground hover:text-foreground"
          >
            Komunitas lain
          </Link>
        </div>
      </div>
    </div>
  );
}
