"use client";

import * as React from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { Cta, NavLink } from "../lib/types";

function linkRel(external?: boolean) {
  return external ? { target: "_blank", rel: "noreferrer noopener" } : {};
}

/** Inline desktop nav — anchors styled as muted links. */
export function DesktopNav({
  nav,
  className,
}: {
  nav: NavLink[];
  className?: string;
}) {
  if (nav.length === 0) return null;
  return (
    <nav className={cn("flex items-center gap-6", className)}>
      {nav.map((item) => (
        <a
          key={item.href + item.label}
          href={item.href}
          {...linkRel(item.external)}
          className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          {item.label}
        </a>
      ))}
    </nav>
  );
}

/** Mobile menu — Button trigger + Sheet panel listing nav + CTAs. */
export function MobileNav({
  nav,
  cta,
  secondaryCta,
  brandName,
}: {
  nav: NavLink[];
  cta?: Cta;
  secondaryCta?: Cta;
  brandName: string;
}) {
  const ctas = [secondaryCta, cta].filter(Boolean) as Cta[];
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Buka menu"
        >
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-72">
        <SheetHeader>
          <SheetTitle>{brandName}</SheetTitle>
        </SheetHeader>
        <div className="mt-6 flex flex-col gap-1">
          {nav.map((item) => (
            <SheetClose asChild key={item.href + item.label}>
              <a
                href={item.href}
                {...linkRel(item.external)}
                className="rounded-md px-2 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
              >
                {item.label}
              </a>
            </SheetClose>
          ))}
        </div>
        {ctas.length > 0 ? (
          <div className="mt-6 flex flex-col gap-2">
            {ctas.map((c, i) => (
              <Button
                key={c.href + c.label}
                asChild
                variant={i === ctas.length - 1 ? "default" : "outline"}
              >
                <a href={c.href}>{c.label}</a>
              </Button>
            ))}
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
