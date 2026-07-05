"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Cta, MarketingHeaderProps } from "../lib/types";
import { DesktopNav, MobileNav } from "./header-nav";
import { BrandMark } from "./BrandMark";

function CtaButtons({ cta, secondaryCta }: { cta?: Cta; secondaryCta?: Cta }) {
  return (
    <>
      {secondaryCta ? (
        <Button asChild variant="ghost" size="sm">
          <a href={secondaryCta.href}>{secondaryCta.label}</a>
        </Button>
      ) : null}
      {cta ? (
        <Button asChild size="sm">
          <a href={cta.href}>{cta.label}</a>
        </Button>
      ) : null}
    </>
  );
}

/**
 * Config-driven marketing site header.
 * - `split`    — brand left, nav centered, CTAs right (default)
 * - `centered` — brand stacked above centered nav, CTAs right
 * - `minimal`  — brand + CTAs only, no inline nav
 */
export function MarketingHeader({
  brand,
  nav,
  cta,
  secondaryCta,
  layout = "split",
  sticky = false,
  className,
}: MarketingHeaderProps) {
  const showNav = layout !== "minimal";
  return (
    <header
      className={cn(
        "w-full border-b bg-background/80 backdrop-blur",
        sticky && "sticky top-0 z-40",
        className,
      )}
    >
      <div
        className={cn(
          "mx-auto flex w-full max-w-6xl items-center gap-4 px-6 py-3",
          layout === "centered" && "flex-col items-stretch sm:gap-2",
        )}
      >
        <div className="flex items-center justify-between gap-4">
          <BrandMark brand={brand} />
          {layout === "centered" ? (
            <div className="flex items-center gap-2 sm:hidden">
              <MobileNav
                nav={nav}
                cta={cta}
                secondaryCta={secondaryCta}
                brandName={brand.name}
              />
            </div>
          ) : null}
          {layout !== "centered" ? (
            <div className="hidden items-center gap-2 md:flex">
              {layout === "split" && showNav ? (
                <DesktopNav nav={nav} className="mr-4" />
              ) : null}
              <CtaButtons cta={cta} secondaryCta={secondaryCta} />
            </div>
          ) : null}
          {layout !== "centered" ? (
            <MobileNav
              nav={nav}
              cta={cta}
              secondaryCta={secondaryCta}
              brandName={brand.name}
            />
          ) : null}
        </div>

        {layout === "centered" ? (
          <div className="hidden items-center justify-center gap-6 sm:flex">
            {showNav ? <DesktopNav nav={nav} /> : null}
            <span className="ml-auto flex items-center gap-2">
              <CtaButtons cta={cta} secondaryCta={secondaryCta} />
            </span>
          </div>
        ) : null}
      </div>
    </header>
  );
}
