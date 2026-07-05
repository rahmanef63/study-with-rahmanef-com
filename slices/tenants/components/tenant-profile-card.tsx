// tenants slice — presentational public community profile (R3 etalase).
// Pure props-driven: no data fetching, so it renders server- or client-side.
// External Discord link uses a plain anchor by design (next/link is for
// internal routes only).
import type { ReactNode } from "react";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-2xl">{tenant.name}</CardTitle>
        {tenant.track ? (
          <span className="bg-accent text-accent-foreground inline-flex w-fit items-center rounded-full px-2 py-0.5 text-xs font-medium">
            {t.trackPrefix}: {tenant.track}
          </span>
        ) : null}
        <CardDescription className="whitespace-pre-line text-base">
          {tenant.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {actions}
        {tenant.discordInviteUrl ? (
          <Button variant="outline" asChild>
            <a href={tenant.discordInviteUrl} target="_blank" rel="noopener noreferrer">
              {t.discordCta}
              <ExternalLink aria-hidden className="size-4" />
            </a>
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
