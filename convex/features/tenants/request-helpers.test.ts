/// <reference types="vite/client" />
// tenants slice — pure request-helper unit tests (no convex-test). Guards the
// slug rules, the input validator, and the admin-queue projection (P0: the
// webhook is never present in the projected shape).
import { describe, expect, test } from "vitest";
import {
  buildTenantRequestInput,
  isValidTenantSlug,
  toPendingRequest,
} from "./request-helpers";
import type { Doc } from "../../_generated/dataModel";

describe("isValidTenantSlug", () => {
  test.each([
    ["belajar-ai", true],
    ["a-b-c", true],
    ["ab", false], // below slugMin (3)
    ["Belajar-AI", false], // uppercase
    ["belajar_ai", false], // underscore
    ["-lead", false],
    ["trail-", false],
    ["with space", false],
    ["double--dash", false],
  ])("%s → %s", (slug, ok) => {
    expect(isValidTenantSlug(slug)).toBe(ok);
  });
});

describe("buildTenantRequestInput", () => {
  test("lowercases + trims the slug, trims text, omits empty optionals", () => {
    const { errors, values } = buildTenantRequestInput({
      slug: "  Belajar-AI  ",
      name: "  Belajar AI  ",
      description: "  Deskripsi yang cukup panjang untuk lolos.  ",
      track: "  ",
      requestMessage: "  ",
    });
    expect(errors).toEqual([]);
    expect(values.slug).toBe("belajar-ai");
    expect(values.name).toBe("Belajar AI");
    expect(values.description).toBe("Deskripsi yang cukup panjang untuk lolos.");
    expect(values.track).toBeUndefined();
    expect(values.requestMessage).toBeUndefined();
  });

  test("collects every invalid field", () => {
    const { errors } = buildTenantRequestInput({
      slug: "bad slug",
      name: "ab",
      description: "pendek",
      track: "x".repeat(41),
      requestMessage: "y".repeat(501),
    });
    expect(errors.sort()).toEqual(
      ["description", "name", "requestMessage", "slug", "track"].sort()
    );
  });
});

describe("toPendingRequest (P0: no webhook)", () => {
  const tenant = {
    _id: "t1",
    _creationTime: 42,
    slug: "belajar-ai",
    name: "Belajar AI",
    description: "Komunitas belajar.",
    track: "umum",
    discordWebhookUrl: "https://discord.com/api/webhooks/1/secret",
    requestMessage: "halo admin",
    status: "pending",
    ownerId: "u1",
  } as unknown as Doc<"tenants">;

  test("projects safe fields and excludes the webhook", () => {
    const profile = {
      _id: "p1",
      _creationTime: 1,
      userId: "u1",
      username: "budi",
      displayName: "Budi",
    } as unknown as Doc<"profiles">;
    const row = toPendingRequest(tenant, profile);
    expect(row).toEqual({
      _id: "t1",
      slug: "belajar-ai",
      name: "Belajar AI",
      description: "Komunitas belajar.",
      track: "umum",
      requestMessage: "halo admin",
      requestedAt: 42,
      owner: { userId: "u1", username: "budi", displayName: "Budi" },
    });
    expect(JSON.stringify(row)).not.toContain("webhook");
    expect(JSON.stringify(row)).not.toContain("secret");
  });

  test("tolerates a missing owner profile", () => {
    const row = toPendingRequest(tenant, null);
    expect(row.owner).toEqual({ userId: "u1", username: undefined, displayName: undefined });
  });
});
