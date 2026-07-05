import type * as React from "react";

/** Brand identity shown in both header and footer. */
export interface Brand {
  name: string;
  href?: string;
  logo?: React.ReactNode;
}

/** Single nav entry. `external` opens in a new tab + adds rel. */
export interface NavLink {
  label: string;
  href: string;
  external?: boolean;
}

/** Call-to-action button (primary or secondary). */
export interface Cta {
  label: string;
  href: string;
}

/** A footer link column. */
export interface FooterColumn {
  heading: string;
  links: { label: string; href: string }[];
}

/** Supported social platforms (mapped to lucide icons). */
export type SocialKind = "github" | "x" | "linkedin" | "youtube" | "instagram";

export interface SocialLink {
  kind: SocialKind;
  href: string;
}

export type HeaderLayout = "split" | "centered" | "minimal";
export type FooterLayout = "columns" | "slim";

export interface MarketingHeaderProps {
  brand: Brand;
  nav: NavLink[];
  cta?: Cta;
  secondaryCta?: Cta;
  layout?: HeaderLayout;
  sticky?: boolean;
  className?: string;
}

export interface MarketingFooterProps {
  brand: Brand;
  columns?: FooterColumn[];
  social?: SocialLink[];
  legal?: { label: string; href: string }[];
  copyright?: string;
  layout?: FooterLayout;
  className?: string;
}
