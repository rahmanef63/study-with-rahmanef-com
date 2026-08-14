"use client";

// The community switcher — shadcn's TeamSwitcher slot, in SidebarHeader.
//
// It replaces a "‹ Komunitas lain" back-link that cost a full row to do one
// thing (leave). The same row now does three: it NAMES where you are, it
// carries the member/course count, and it is the way to somewhere else. That is
// the trade the header needed — it was spending 177px, a fifth of a 900px
// viewport, before the first destination.
//
// THE LIST IS FETCHED LAZILY, on open, and that is the whole reason this is a
// client island. `listActive` is cheap and anonymous, but the rail mounts on
// every single page in the app; subscribing on mount would put a Convex query
// behind every navigation to populate a menu almost nobody opens. `"skip"`
// until `open` costs exactly nothing until the first click.
import Link from "next/link";
import { useState } from "react";
import { useQuery } from "convex/react";
import { Check, ChevronsUpDown, LayoutGrid } from "lucide-react";
import { api } from "@convex/_generated/api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { communityHref } from "@/lib/community";
import { CourseCover } from "@/features/courses";

export type SidebarSwitcherProps = {
  /** Absent on the account surfaces — the trigger then names the product. */
  current?: { slug: string; name: string; memberLabel?: string | null };
  /** Closes the phone slide-over. */
  onNavigate?: () => void;
};

const TRIGGER =
  "pixel-press flex min-h-11 w-full items-center gap-2.5 border border-transparent px-2 text-left transition-colors hover:bg-muted/50 md:min-h-10";

export function SidebarSwitcher({ current, onNavigate }: SidebarSwitcherProps) {
  const [open, setOpen] = useState(false);
  const tenants = useQuery(api.features.tenants.queries.listActive, open ? {} : "skip");

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger className={TRIGGER}>
        {/* The same procedural art the directory and the course cards use, so a
            community looks like itself in all three places without an upload. */}
        {current ? (
          <CourseCover slug={current.slug} className="size-9 shrink-0 border border-border" />
        ) : (
          <span className="grid size-9 shrink-0 place-items-center border border-border text-primary">
            <LayoutGrid className="size-4" aria-hidden />
          </span>
        )}
        <span className="flex min-w-0 flex-1 flex-col">
          {/* BODY FACE, not the display one, and that is the design system's own
              rule rather than a preference: Press Start 2P is DISPLAY-ONLY here
              precisely because it truncates. The old header could afford it —
              it had the rail's full width and nothing beside it. This trigger
              gives ~170px to the name after the cover, the gap and the chevron,
              and at that width "Belajar AI bareng Rahman" clamped to
              "BELAJAR AI BARENG…". A community's name is not decoration; the
              arcade signal is carried by the cover art next to it.

              Not an <h1>: the page's heading is server-rendered in the content
              column. */}
          <span className="line-clamp-2 text-sm font-medium leading-tight [overflow-wrap:anywhere]">
            {current?.name ?? "Belajar"}
          </span>
          <span className="truncate text-caption text-muted-foreground">
            {current?.memberLabel ?? "Pilih komunitas"}
          </span>
        </span>
        <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        // The rail is 224-256px; matching the trigger's width keeps the menu
        // from hanging over the content column like a tooltip.
        className="w-(--radix-dropdown-menu-trigger-width) min-w-56"
      >
        <DropdownMenuLabel className="text-caption uppercase tracking-wider text-muted-foreground">
          Komunitas
        </DropdownMenuLabel>
        {tenants === undefined ? (
          <div className="space-y-1 p-1" aria-hidden>
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : (
          tenants.map((tenant) => (
            <DropdownMenuItem key={tenant._id} asChild>
              <Link href={communityHref.home(tenant.slug)} onClick={onNavigate} className="gap-2.5">
                <CourseCover
                  slug={tenant.slug}
                  src={tenant.coverImageUrl}
                  className="size-6 shrink-0 border border-border"
                />
                <span className="min-w-0 flex-1 truncate">{tenant.name}</span>
                {tenant.slug === current?.slug ? (
                  <Check className="size-4 shrink-0 text-primary" aria-hidden />
                ) : null}
              </Link>
            </DropdownMenuItem>
          ))
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/komunitas" onClick={onNavigate} className="gap-2.5">
            <LayoutGrid className="size-4 shrink-0" aria-hidden />
            Jelajahi semua komunitas
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
