"use client";

// tenants slice — owner profile edit form (presentational; the settings view
// wires the mutation). Webhook field is WRITE-ONLY: never prefilled, submitted
// only when the owner types a new value or explicitly clears it.
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEFAULT_TENANT_LABELS } from "../config/labels";
import type { ManagedTenant, TenantLabels } from "../types";
import { TrackPicker } from "./track-picker";
import { UiTextarea } from "./ui-textarea";

export type TenantProfileSubmitValues = {
  name: string;
  description: string;
  track: string;
  discordInviteUrl: string;
  /** Omitted when untouched; "" = clear; value = replace. */
  discordWebhookUrl?: string;
};

export type TenantProfileFormProps = {
  tenant: ManagedTenant;
  onSubmit: (values: TenantProfileSubmitValues) => void | Promise<unknown>;
  isPending?: boolean;
  labels?: Partial<TenantLabels["settings"]>;
};

export function TenantProfileForm({
  tenant,
  onSubmit,
  isPending,
  labels,
}: TenantProfileFormProps) {
  const t = { ...DEFAULT_TENANT_LABELS.settings, ...labels };
  const [name, setName] = useState(tenant.name);
  const [description, setDescription] = useState(tenant.description);
  const [track, setTrack] = useState(tenant.track ?? "");
  const [discordInviteUrl, setDiscordInviteUrl] = useState(tenant.discordInviteUrl ?? "");
  const [webhook, setWebhook] = useState("");
  const [clearWebhook, setClearWebhook] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const values: TenantProfileSubmitValues = { name, description, track, discordInviteUrl };
    if (clearWebhook) values.discordWebhookUrl = "";
    else if (webhook.trim() !== "") values.discordWebhookUrl = webhook.trim();
    void onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="tenant-name">{t.nameLabel}</Label>
        <Input
          id="tenant-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t.namePlaceholder}
          disabled={isPending}
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="tenant-description">{t.descriptionLabel}</Label>
        <UiTextarea
          id="tenant-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t.descriptionPlaceholder}
          disabled={isPending}
          rows={4}
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>{t.trackLabel}</Label>
        <p className="text-muted-foreground text-xs">{t.trackHelp}</p>
        <TrackPicker
          value={track}
          onChange={setTrack}
          customPlaceholder={t.trackCustomPlaceholder}
          disabled={isPending}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="tenant-discord-invite">{t.discordInviteLabel}</Label>
        <Input
          id="tenant-discord-invite"
          type="url"
          value={discordInviteUrl}
          onChange={(e) => setDiscordInviteUrl(e.target.value)}
          placeholder={t.discordInvitePlaceholder}
          disabled={isPending}
        />
        <p className="text-muted-foreground text-xs">{t.discordInviteHelp}</p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="tenant-webhook">{t.webhookLabel}</Label>
        <Input
          id="tenant-webhook"
          type="password"
          autoComplete="off"
          value={webhook}
          onChange={(e) => {
            setWebhook(e.target.value);
            setClearWebhook(false);
          }}
          placeholder={t.webhookPlaceholder}
          disabled={isPending || clearWebhook}
        />
        <p className="text-muted-foreground text-xs">
          {clearWebhook
            ? t.webhookClearConfirm
            : tenant.hasDiscordWebhook
              ? t.webhookHelpSet
              : t.webhookHelpUnset}
        </p>
        {tenant.hasDiscordWebhook ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-fit"
            disabled={isPending}
            onClick={() => {
              setClearWebhook((prev) => !prev);
              setWebhook("");
            }}
          >
            {t.webhookClear}
          </Button>
        ) : null}
      </div>

      <Button type="submit" disabled={isPending} className="w-fit">
        {isPending ? t.submitting : t.submit}
      </Button>
    </form>
  );
}
