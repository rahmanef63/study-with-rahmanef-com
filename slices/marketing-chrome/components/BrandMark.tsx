import * as React from "react";
import type { Brand } from "../lib/types";

export function BrandMark({ brand }: { brand: Brand }) {
  const inner = (
    <span className="flex items-center gap-2 font-semibold tracking-tight">
      {brand.logo}
      <span>{brand.name}</span>
    </span>
  );
  return brand.href ? (
    <a href={brand.href} className="transition-opacity hover:opacity-80">
      {inner}
    </a>
  ) : (
    inner
  );
}
