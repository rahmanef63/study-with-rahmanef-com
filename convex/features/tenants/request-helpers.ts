// tenants slice — pure helpers for the community request + approval flow
// (#6, v1.1). No ctx here: slug/input validation + the admin-queue safe
// projection. P0 (DATA-MODEL.md security note #1): `discordWebhookUrl` never
// appears in the pending projection below.
import type { Doc, Id } from "../../_generated/dataModel";
import { TENANT_LIMITS } from "./helpers";

export const TENANT_REQUEST_LIMITS = {
  slugMin: 3,
  slugMax: 64,
  requestMessageMax: 500,
  /** Max pending requests a single user may hold open at once (anti-spam). */
  pendingPerUser: 1,
  /** Bounded scan window over by_status "pending" for the anti-spam count. */
  pendingScanMax: 500,
  /** Bounded admin queue page size. */
  listPendingMax: 100,
} as const;

/** Global tenant slug: lowercase kebab-case (mirrors courses slug rules). */
const TENANT_SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isValidTenantSlug(slug: string): boolean {
  return (
    slug.length >= TENANT_REQUEST_LIMITS.slugMin &&
    slug.length <= TENANT_REQUEST_LIMITS.slugMax &&
    TENANT_SLUG_RE.test(slug)
  );
}

export type TenantRequestInput = {
  slug: string;
  name: string;
  description: string;
  track?: string;
  requestMessage?: string;
};

/** Normalized, validated request values ready to insert. */
export type TenantRequestValues = {
  slug: string;
  name: string;
  description: string;
  track?: string;
  requestMessage?: string;
};

/**
 * Validate a requestTenant input and build the normalized values.
 * Only the case of the slug is normalized (lowercased) — anything that is not
 * already kebab-case (spaces, underscores, …) is REJECTED, never rewritten, so
 * the resulting URL never surprises the requester. `""` track/message → omitted.
 */
export function buildTenantRequestInput(input: TenantRequestInput): {
  errors: string[];
  values: TenantRequestValues;
} {
  const errors: string[] = [];
  const L = TENANT_LIMITS;
  const R = TENANT_REQUEST_LIMITS;

  const slug = input.slug.trim().toLowerCase();
  if (!isValidTenantSlug(slug)) errors.push("slug");

  const name = input.name.trim();
  if (name.length < L.nameMin || name.length > L.nameMax) errors.push("name");

  const description = input.description.trim();
  if (description.length < L.descriptionMin || description.length > L.descriptionMax) {
    errors.push("description");
  }

  let track: string | undefined;
  if (input.track !== undefined) {
    const value = input.track.trim();
    if (value.length > L.trackMax) errors.push("track");
    else track = value === "" ? undefined : value;
  }

  let requestMessage: string | undefined;
  if (input.requestMessage !== undefined) {
    const value = input.requestMessage.trim();
    if (value.length > R.requestMessageMax) errors.push("requestMessage");
    else requestMessage = value === "" ? undefined : value;
  }

  return { errors, values: { slug, name, description, track, requestMessage } };
}

/** Admin-queue row shape. Never carries `discordWebhookUrl` (P0). */
export type PendingRequest = {
  _id: Id<"tenants">;
  slug: string;
  name: string;
  description: string;
  track?: string;
  requestMessage?: string;
  requestedAt: number;
  owner: {
    userId: Id<"users">;
    username?: string;
    displayName?: string;
  };
};

/**
 * Project a pending tenant (+ owner profile) into the admin-queue shape.
 * Pending rows shouldn't have a webhook, but the projection guarantees the
 * secret is excluded regardless of the stored row.
 */
export function toPendingRequest(
  tenant: Doc<"tenants">,
  ownerProfile: Doc<"profiles"> | null
): PendingRequest {
  return {
    _id: tenant._id,
    slug: tenant.slug,
    name: tenant.name,
    description: tenant.description,
    track: tenant.track,
    requestMessage: tenant.requestMessage,
    requestedAt: tenant._creationTime,
    owner: {
      userId: tenant.ownerId,
      username: ownerProfile?.username,
      displayName: ownerProfile?.displayName,
    },
  };
}
