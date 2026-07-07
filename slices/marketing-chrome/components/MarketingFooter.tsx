"use client";

import * as React from "react";
import {
  AtSign,
  Bird,
  Camera,
  GitFork,
  PlayCircle,
  type LucideIcon,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type {
  MarketingFooterProps,
  SocialKind,
  SocialLink,
} from "../lib/types";
import { BrandMark } from "./BrandMark";

// NOTE: lucide dropped dedicated brand glyphs; these are the closest neutral
// stand-ins. Swap for your brand-icon set (e.g. simple-icons) post-copy.
const SOCIAL_ICON: Record<SocialKind, LucideIcon> = {
  github: GitFork,
  x: Bird,
  linkedin: AtSign,
  youtube: PlayCircle,
  instagram: Camera,
};

function Social({ social }: { social: SocialLink[] }) {
  if (social.length === 0) return null;
  return (
    <div className="-ml-2.5 flex items-center gap-0.5">
      {social.map((s) => {
        const Icon = SOCIAL_ICON[s.kind];
        return (
          <a
            key={s.kind + s.href}
            href={s.href}
            aria-label={s.kind}
            target="_blank"
            rel="noreferrer noopener"
            className="grid size-11 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Icon className="size-4" />
          </a>
        );
      })}
    </div>
  );
}

function LegalRow({
  copyright,
  legal,
}: {
  copyright?: string;
  legal: { label: string; href: string }[];
}) {
  return (
    <div className="flex flex-col items-center justify-between gap-2 text-xs text-muted-foreground sm:flex-row">
      <span>{copyright}</span>
      {legal.length > 0 ? (
        <div className="flex items-center gap-4">
          {legal.map((l) => (
            <a
              key={l.href + l.label}
              href={l.href}
              className="transition-colors hover:text-foreground"
            >
              {l.label}
            </a>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/**
 * Config-driven marketing footer.
 * - `columns` (default) — brand blurb + multi-column link grid + legal bar
 * - `slim` — single row: brand · legal links · social
 */
export function MarketingFooter({
  brand,
  columns = [],
  social = [],
  legal = [],
  copyright,
  layout = "columns",
  className,
}: MarketingFooterProps) {
  if (layout === "slim") {
    return (
      <footer className={cn("w-full border-t bg-background", className)}>
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-6 py-6 sm:flex-row">
          <BrandMark brand={brand} />
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {legal.map((l) => (
              <a
                key={l.href + l.label}
                href={l.href}
                className="transition-colors hover:text-foreground"
              >
                {l.label}
              </a>
            ))}
            {copyright ? <span>{copyright}</span> : null}
          </div>
          <Social social={social} />
        </div>
      </footer>
    );
  }

  return (
    <footer className={cn("w-full border-t bg-background", className)}>
      <div className="mx-auto w-full max-w-6xl px-6 py-12">
        <div className="grid gap-10 md:grid-cols-[1.5fr_repeat(auto-fit,minmax(0,1fr))]">
          <div className="flex flex-col gap-4">
            <BrandMark brand={brand} />
            <Social social={social} />
          </div>
          {columns.map((col) => (
            <div key={col.heading} className="flex flex-col gap-3">
              <h3 className="eyebrow">{col.heading}</h3>
              <ul className="flex flex-col gap-2">
                {col.links.map((l) => (
                  <li key={l.href + l.label}>
                    <a
                      href={l.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <Separator className="my-8" />
        <LegalRow copyright={copyright} legal={legal} />
      </div>
    </footer>
  );
}
