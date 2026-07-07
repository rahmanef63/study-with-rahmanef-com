// tenants slice — presentational public community profile (R3 etalase).
// Pure props-driven: no data fetching, so it renders server- or client-side.
// External Discord link uses a plain anchor by design (next/link is for
// internal routes only).
import type { ReactNode } from "react";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Hero, Badge } from "@/components/mockup-kit";
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
    <Hero
      eyebrow="Komunitas belajar"
      title={<span className="break-words">{tenant.name}</span>}
      description={<span className="whitespace-pre-line">{tenant.description}</span>}
      className={className}
    >
      <div className="flex flex-col gap-4">
        {tenant.track ? (
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="accent">
              {t.trackPrefix}: {tenant.track}
            </Badge>
          </div>
        ) : null}
        {actions || tenant.discordInviteUrl ? (
          <div className="flex flex-col gap-3 @sm:flex-row @sm:items-center">
            {actions}
            {tenant.discordInviteUrl ? (
              <Button variant="outline" asChild className="min-h-11 @sm:min-h-9">
                <a href={tenant.discordInviteUrl} target="_blank" rel="noopener noreferrer">
                  {t.discordCta}
                  <ExternalLink aria-hidden className="size-4" />
                </a>
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    </Hero>
  );
}
