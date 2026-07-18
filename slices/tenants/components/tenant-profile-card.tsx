// tenants slice — presentational public community profile (R3 etalase).
// Pure props-driven: no data fetching, so it renders server- or client-side.
// External Discord link uses a plain anchor by design (next/link is for
// internal routes only).
import type { ReactNode } from "react";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Hero, Badge } from "@/components/mockup-kit";
import { cn } from "@/lib/utils";
import { DEFAULT_TENANT_LABELS } from "../config/labels";
import type { PublicTenant, TenantLabels } from "../types";

export type TenantProfileCardProps = {
  tenant: PublicTenant;
  labels?: Partial<TenantLabels["home"]>;
  /** Slot for the join CTA (kept separate so this stays presentational). */
  actions?: ReactNode;
  /** Owner-only "add/change cover" control, shown on the banner corner. */
  coverAction?: ReactNode;
  className?: string;
};

export function TenantProfileCard({
  tenant,
  labels,
  actions,
  coverAction,
  className,
}: TenantProfileCardProps) {
  const t = { ...DEFAULT_TENANT_LABELS.home, ...labels };
  return (
    <div className={cn("space-y-4", className)}>
      {tenant.coverImageUrl ? (
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element -- external cover URL, no next/image */}
          <img
            src={tenant.coverImageUrl}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-32 w-full rounded-[var(--radius-win)] border border-border object-cover @md:h-44"
            onError={(e) => { e.currentTarget.style.display = "none"; }}
          />
          {coverAction ? <div className="absolute right-3 top-3">{coverAction}</div> : null}
        </div>
      ) : coverAction ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-win)] border border-dashed border-border bg-muted/30 px-4 py-3">
          <span className="text-sm text-muted-foreground">Belum ada sampul komunitas.</span>
          {coverAction}
        </div>
      ) : null}
      <Hero
        eyebrow="Komunitas belajar"
        title={<span className="break-words">{tenant.name}</span>}
        description={<span className="whitespace-pre-line">{tenant.description}</span>}
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
    </div>
  );
}
