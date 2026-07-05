// tenants slice — pure helpers: safe projections + input validation.
// P0 (AGENTS.md §6 / DATA-MODEL.md security note #1): `discordWebhookUrl` must
// NEVER appear in any query result. Every read path goes through one of the
// projections below; neither includes the webhook.
import type { Doc, Id } from "../../_generated/dataModel";

/** Safe shape for PUBLIC reads (etalase). No webhook, no ownerId, no requestMessage. */
export type PublicTenant = {
  _id: Id<"tenants">;
  slug: string;
  name: string;
  description: string;
  track?: string;
  discordInviteUrl?: string;
};

/** Shape for the OWNER manage view. Webhook replaced by a boolean flag. */
export type ManagedTenant = PublicTenant & {
  status: "pending" | "active" | "suspended";
  /** Write-only secret: only its presence is ever revealed. */
  hasDiscordWebhook: boolean;
};

export function toPublicTenant(t: Doc<"tenants">): PublicTenant {
  return {
    _id: t._id,
    slug: t.slug,
    name: t.name,
    description: t.description,
    track: t.track,
    discordInviteUrl: t.discordInviteUrl,
  };
}

export function toManagedTenant(t: Doc<"tenants">): ManagedTenant {
  return {
    ...toPublicTenant(t),
    status: t.status,
    hasDiscordWebhook: typeof t.discordWebhookUrl === "string" && t.discordWebhookUrl.length > 0,
  };
}

// ---------------------------------------------------------------------------
// Validation (VALIDATION_FAILED on breach). Limits are by-design bounds.
// ---------------------------------------------------------------------------

export const TENANT_LIMITS = {
  nameMin: 3,
  nameMax: 80,
  descriptionMin: 10,
  descriptionMax: 500,
  trackMax: 40,
  membersPageDefault: 50,
  membersPageMax: 200,
  activeListMax: 50,
} as const;

/** Discord invite links only — keeps the public CTA on a trusted domain. */
export function isValidDiscordInviteUrl(url: string): boolean {
  return /^https:\/\/(discord\.gg|discord\.com\/invite)\/[\w-]+\/?$/.test(url);
}

/** Discord webhook endpoints only — anything else is rejected at write time. */
export function isValidDiscordWebhookUrl(url: string): boolean {
  return /^https:\/\/(discord|discordapp)\.com\/api\/webhooks\/\d+\/[\w-]+$/.test(url);
}

export type TenantProfilePatch = {
  name?: string;
  description?: string;
  track?: string;
  discordInviteUrl?: string;
  discordWebhookUrl?: string;
};

/**
 * Validate an updateProfile input and build the DB patch.
 * Semantics: `undefined` = leave unchanged; `""` = clear the optional field
 * (name/description are required and reject ""). Returns the field errors
 * (empty array = valid) plus the patch to apply.
 */
export function buildProfilePatch(input: TenantProfilePatch): {
  errors: string[];
  patch: Record<string, string | undefined>;
} {
  const errors: string[] = [];
  const patch: Record<string, string | undefined> = {};
  const L = TENANT_LIMITS;

  if (input.name !== undefined) {
    const name = input.name.trim();
    if (name.length < L.nameMin || name.length > L.nameMax) {
      errors.push("name");
    } else {
      patch.name = name;
    }
  }
  if (input.description !== undefined) {
    const description = input.description.trim();
    if (description.length < L.descriptionMin || description.length > L.descriptionMax) {
      errors.push("description");
    } else {
      patch.description = description;
    }
  }
  if (input.track !== undefined) {
    const track = input.track.trim();
    if (track.length > L.trackMax) errors.push("track");
    else patch.track = track === "" ? undefined : track;
  }
  if (input.discordInviteUrl !== undefined) {
    const url = input.discordInviteUrl.trim();
    if (url === "") patch.discordInviteUrl = undefined;
    else if (isValidDiscordInviteUrl(url)) patch.discordInviteUrl = url;
    else errors.push("discordInviteUrl");
  }
  if (input.discordWebhookUrl !== undefined) {
    const url = input.discordWebhookUrl.trim();
    if (url === "") patch.discordWebhookUrl = undefined;
    else if (isValidDiscordWebhookUrl(url)) patch.discordWebhookUrl = url;
    else errors.push("discordWebhookUrl");
  }

  return { errors, patch };
}
