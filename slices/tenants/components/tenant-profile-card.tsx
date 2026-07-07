// tenants slice — presentational public community profile (R3 etalase).
// Pure props-driven: no data fetching, so it renders server- or client-side.
// External Discord link uses a plain anchor by design (next/link is for
// internal routes only).
import type { ReactNode } from "react";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DEFAULT_TENANT_LABELS } from "../config/labels";
import type { PublicTenant, TenantLabels } from "../types";

export type TenantProfileCardProps = {
  tenant: PublicTenant;
  labels?: Partial<TenantLabels["home"]>;
  /** Slot for the join CTA (kept separate so this stays presentational). */
  actions?: ReactNode;
  className?: string;
};

export function TenantProfileCard({
  tenant,
  labels,
  actions,
  className,
}: TenantProfileCardProps) {
  const t = { ...DEFAULT_TENANT_LABELS.home, ...labels };
  return (
    <section className={cn("border-b pb-8", className)}>
      <span className="eyebrow">Komunitas belajar</span>
      <h1 className="mt-2 text-balance break-words text-3xl sm:text-4xl">{tenant.name}</h1>
      {tenant.track ? (
        <span className="mt-3 inline-flex w-fit items-center rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground">
          {t.trackPrefix}: {tenant.track}
        </span>
      ) : null}
      <p className="mt-4 max-w-2xl whitespace-pre-line text-pretty text-base leading-relaxed text-muted-foreground">
        {tenant.description}
      </p>
      {actions || tenant.discordInviteUrl ? (
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          {actions}
          {tenant.discordInviteUrl ? (
            <Button variant="outline" asChild className="min-h-11 sm:min-h-9">
              <a href={tenant.discordInviteUrl} target="_blank" rel="noopener noreferrer">
                {t.discordCta}
                <ExternalLink aria-hidden className="size-4" />
              </a>
            </Button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
