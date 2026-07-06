// tenants slice — public types (the contract consumers rely on).
import type { Id } from "@convex/_generated/dataModel";

/** Error codes thrown by the tenants Convex functions (rr conventions). */
export type TenantsErrorCode =
  | "NOT_AUTHENTICATED"
  | "NOT_AUTHORIZED"
  | "NOT_FOUND"
  | "VALIDATION_FAILED"
  | "RATE_LIMITED";

export type TenantRole = "owner" | "instructor" | "member";

/** Safe public tenant shape — mirrors convex/features/tenants/helpers.ts. */
export type PublicTenant = {
  _id: Id<"tenants">;
  slug: string;
  name: string;
  description: string;
  track?: string;
  discordInviteUrl?: string;
};

/** Owner manage shape — webhook URL is write-only, only its presence is known. */
export type ManagedTenant = PublicTenant & {
  status: "pending" | "active" | "suspended";
  hasDiscordWebhook: boolean;
};

export type MyMembership = { role: TenantRole; since: number } | null;

/** A community the caller belongs to ("Komunitas saya"): public shape + role. */
export type MyCommunity = PublicTenant & { role: TenantRole };

export type TenantMember = {
  userId: Id<"users">;
  role: TenantRole;
  since: number;
  username?: string;
  displayName?: string;
  avatarUrl?: string;
};

/** One row of the platform-admin approval queue (mirrors request-helpers.ts). */
export type PendingTenantRequest = {
  _id: Id<"tenants">;
  slug: string;
  name: string;
  description: string;
  track?: string;
  requestMessage?: string;
  requestedAt: number;
  owner: { userId: Id<"users">; username?: string; displayName?: string };
};

/** Values the "request a community" form submits (#6). */
export type RequestTenantFormValues = {
  slug: string;
  name: string;
  description: string;
  track: string;
  requestMessage: string;
};

/** Values the settings form submits. "" clears an optional field. */
export type TenantProfileFormValues = {
  name: string;
  description: string;
  track: string;
  discordInviteUrl: string;
  /** Never prefilled — write-only. Empty string = leave unchanged (form-level). */
  discordWebhookUrl: string;
};

/** UI copy — Bahasa Indonesia defaults in config/labels.ts, overridable via props. */
export type TenantLabels = typeof import("./config/labels").DEFAULT_TENANT_LABELS;
