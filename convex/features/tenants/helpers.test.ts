// tenants slice — pure validation/projection unit tests (no convex-test).
import { describe, expect, test } from "vitest";
import {
  buildProfilePatch,
  isValidDiscordInviteUrl,
  isValidDiscordWebhookUrl,
  toManagedTenant,
  toPublicTenant,
} from "./helpers";
import type { Doc } from "../../_generated/dataModel";

const tenant = {
  _id: "t1",
  _creationTime: 1,
  slug: "belajar-ai",
  name: "Belajar AI",
  description: "Komunitas belajar.",
  track: "umum",
  discordInviteUrl: "https://discord.gg/abc",
  discordWebhookUrl: "https://discord.com/api/webhooks/1/secret",
  status: "active",
  ownerId: "u1",
  requestMessage: "halo",
} as unknown as Doc<"tenants">;

describe("projections (P0: webhook never leaves the server)", () => {
  test("toPublicTenant strips webhook, ownerId, requestMessage, status", () => {
    const pub = toPublicTenant(tenant);
    expect(pub).toEqual({
      _id: "t1",
      slug: "belajar-ai",
      name: "Belajar AI",
      description: "Komunitas belajar.",
      track: "umum",
      discordInviteUrl: "https://discord.gg/abc",
    });
    expect(JSON.stringify(pub)).not.toContain("webhook");
  });

  test("toManagedTenant exposes only the webhook flag", () => {
    const managed = toManagedTenant(tenant);
    expect(managed.hasDiscordWebhook).toBe(true);
    expect(managed.status).toBe("active");
    expect(JSON.stringify(managed)).not.toContain("secret");
    const bare = toManagedTenant({ ...tenant, discordWebhookUrl: undefined });
    expect(bare.hasDiscordWebhook).toBe(false);
  });
});

describe("url validators", () => {
  test.each([
    ["https://discord.gg/abc123", true],
    ["https://discord.com/invite/abc-123", true],
    ["http://discord.gg/abc", false],
    ["https://evil.com/?u=https://discord.gg/abc", false],
    ["https://discord.gg/abc 123", false],
  ])("invite %s → %s", (url, ok) => {
    expect(isValidDiscordInviteUrl(url)).toBe(ok);
  });

  test.each([
    ["https://discord.com/api/webhooks/123/tok-en_A", true],
    ["https://discordapp.com/api/webhooks/123/token", true],
    ["https://discord.com/api/webhooks/abc/token", false],
    ["https://example.com/api/webhooks/123/token", false],
    ["http://discord.com/api/webhooks/123/token", false],
  ])("webhook %s → %s", (url, ok) => {
    expect(isValidDiscordWebhookUrl(url)).toBe(ok);
  });
});

describe("buildProfilePatch semantics", () => {
  test("undefined = unchanged; values trimmed; '' clears optionals", () => {
    const { errors, patch } = buildProfilePatch({
      name: "  Nama Komunitas  ",
      track: "",
      discordInviteUrl: "",
      discordWebhookUrl: "",
    });
    expect(errors).toEqual([]);
    expect(patch).toEqual({
      name: "Nama Komunitas",
      track: undefined,
      discordInviteUrl: undefined,
      discordWebhookUrl: undefined,
    });
    expect("description" in patch).toBe(false);
  });

  test("collects every invalid field", () => {
    const { errors } = buildProfilePatch({
      name: "ab",
      description: "pendek",
      track: "x".repeat(41),
      discordInviteUrl: "https://nope.example",
      discordWebhookUrl: "https://nope.example",
    });
    expect(errors.sort()).toEqual(
      ["description", "discordInviteUrl", "discordWebhookUrl", "name", "track"].sort()
    );
  });
});
