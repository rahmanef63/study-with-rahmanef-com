"use client";

import { usePathname } from "next/navigation";
import { BreadcrumbTrail } from "@/components/shell/breadcrumb-trail";
import { adminBreadcrumbs } from "@/components/shell/breadcrumb-model";
import { AdminNav } from "./admin-nav";

/** Where you are, then (on a phone) the same Pantau / Kelola groups the
 *  sidebar shows beside the page. The trail sits above the title. */
export function AdminPageHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  const pathname = usePathname();
  return (
    <header className="space-y-3">
      <BreadcrumbTrail items={adminBreadcrumbs(pathname)} />
      <div className="min-w-0">
        <h1 className="text-xl font-semibold tracking-tight text-foreground lg:text-2xl">{title}</h1>
        {description ? <p className="mt-1 max-w-2xl text-pretty text-sm text-muted-foreground">{description}</p> : null}
      </div>
      <AdminNav />
    </header>
  );
}
