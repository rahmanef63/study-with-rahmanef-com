"use client";

// tenants slice — `/buka-komunitas` public request form (#6, R7). Any signed-in
// user may ask to open a community; it lands `pending` for admin review. The
// real guard is requireUser on the Convex mutation — this client gate is UX.
import { useState, type FormEvent } from "react";
import { useConvexAuth } from "convex/react";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { DEFAULT_TENANT_LABELS } from "../config/labels";
import { useRequestTenant } from "../hooks/use-tenant-mutations";
import type { TenantLabels } from "../types";
import { TrackPicker } from "./track-picker";
import { UiTextarea } from "./ui-textarea";

export type RequestTenantFormProps = {
  labels?: Partial<TenantLabels["request"]>;
  className?: string;
  /** Called after a successful request with the new tenant slug. */
  onSuccess?: (slug: string) => void;
};

export function RequestTenantForm({ labels, className, onSuccess }: RequestTenantFormProps) {
  const t = { ...DEFAULT_TENANT_LABELS.request, ...labels };
  const { isAuthenticated, isLoading } = useConvexAuth();
  const [request, { isPending }] = useRequestTenant({ success: t.success });

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [track, setTrack] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const result = await request({
      slug,
      name,
      description,
      track: track.trim() === "" ? undefined : track,
      requestMessage: message.trim() === "" ? undefined : message,
    });
    if (result) {
      setName("");
      setSlug("");
      setDescription("");
      setTrack("");
      setMessage("");
      onSuccess?.(result.slug);
    }
  };

  if (isLoading) {
    return (
      <div className={className}>
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Empty className={className}>
        <EmptyHeader>
          <EmptyTitle>{t.loginFirstTitle}</EmptyTitle>
          <EmptyDescription>{t.loginFirstBody}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`flex flex-col gap-5 ${className ?? ""}`}>
      <div className="flex flex-col gap-2">
        <Label htmlFor="request-name">{t.nameLabel}</Label>
        <Input
          id="request-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t.namePlaceholder}
          disabled={isPending}
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="request-slug">{t.slugLabel}</Label>
        <Input
          id="request-slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder={t.slugPlaceholder}
          disabled={isPending}
          required
        />
        <p className="text-muted-foreground text-xs">{t.slugHelp}</p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="request-description">{t.descriptionLabel}</Label>
        <UiTextarea
          id="request-description"
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
        <Label htmlFor="request-message">{t.messageLabel}</Label>
        <UiTextarea
          id="request-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={t.messagePlaceholder}
          disabled={isPending}
          rows={3}
        />
      </div>

      <Button type="submit" disabled={isPending} className="w-fit">
        {isPending ? t.submitting : t.submit}
      </Button>
    </form>
  );
}
