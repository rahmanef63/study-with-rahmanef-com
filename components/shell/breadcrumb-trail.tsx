import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { Crumb } from "./breadcrumb-model";

/**
 * Compact trail. Parents are links; the current page is the last item and is
 * not a link. Items wrap, and a long label truncates, so a phone does not
 * grow a horizontal scrollbar.
 */
export function BreadcrumbTrail({ items }: { items: readonly Crumb[] }) {
  if (items.length < 2) return null;
  return (
    <nav aria-label="Jejak halaman">
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-muted-foreground">
        {items.map((item, index) => {
          const current = index === items.length - 1 || item.href === undefined;
          return (
            <li key={`${item.label}-${index}`} className="inline-flex max-w-full min-w-0 items-center gap-1.5">
              {index > 0 ? <ChevronRight className="size-3 shrink-0" aria-hidden /> : null}
              {current ? (
                <span aria-current="page" className="max-w-48 truncate font-medium text-foreground sm:max-w-xs" title={item.label}>
                  {item.label}
                </span>
              ) : (
                <Link href={item.href!} className="max-w-40 truncate hover:text-foreground sm:max-w-none" title={item.label}>
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
