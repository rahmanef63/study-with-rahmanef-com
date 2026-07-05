// tenants slice — barrel API contract test (DoD §5.3). Consumers rely on
// exactly these exports; renaming/removing any of them is a breaking change.
//
// NOTE: importing the barrel pulls "@/components/ui/*" + "@convex/*" aliased
// modules, so vitest needs tsconfig-paths resolution (proposal filed for the
// integrator: add `vite-tsconfig-paths` to vitest.config.mts). Runs green
// under `npx tsc --noEmit` today.
import { describe, expect, test } from "vitest";
import * as barrel from "../index";
import metadata from "../slice.json";
import manifest from "../slice.manifest.json";

const EXPECTED_COMPONENTS = [
  "TenantHomeView",
  "TenantSettingsView",
  "JoinButton",
  "MembersList",
  "TenantProfileCard",
  "TenantProfileForm",
  "RoleChip",
] as const;

const EXPECTED_HOOKS = [
  "useTenantBySlug",
  "useActiveTenants",
  "useMyMembership",
  "useTenantMembers",
  "useTenantManageView",
  "useJoinTenant",
  "useUpdateTenantProfile",
  "useSetMemberRole",
] as const;

const EXPECTED_VALUES = [
  "tenantsApi",
  "tenantsFeature",
  "DEFAULT_TENANT_LABELS",
  "TENANT_TRACK_PRESETS",
  "errorToCopy",
  "extractErrorCode",
] as const;

describe("tenants barrel contract", () => {
  test.each([...EXPECTED_COMPONENTS, ...EXPECTED_HOOKS])("exports %s as a function", (name) => {
    expect(typeof (barrel as Record<string, unknown>)[name]).toBe("function");
  });

  test.each(EXPECTED_VALUES)("exports %s", (name) => {
    expect((barrel as Record<string, unknown>)[name]).toBeDefined();
  });

  test("tenantsApi covers every convex function in the contract", () => {
    expect(Object.keys(barrel.tenantsApi).sort()).toEqual(
      [
        "getManageView",
        "getMyMembership",
        "getPublicBySlug",
        "join",
        "listActive",
        "listMembers",
        "setMemberRole",
        "updateProfile",
      ].sort()
    );
  });

  test("labels ship required Bahasa copy groups", () => {
    expect(Object.keys(barrel.DEFAULT_TENANT_LABELS)).toEqual(
      expect.arrayContaining(["home", "join", "roles", "members", "settings", "errors"])
    );
    for (const code of [
      "NOT_AUTHENTICATED",
      "NOT_AUTHORIZED",
      "NOT_FOUND",
      "VALIDATION_FAILED",
      "RATE_LIMITED",
      "UNKNOWN",
    ]) {
      expect(barrel.DEFAULT_TENANT_LABELS.errors[code]).toBeTruthy();
    }
  });

  test("metadata pair versions are in sync (audit:slices)", () => {
    expect(metadata.version).toBe(manifest.version);
    expect(metadata.slug).toBe("tenants");
    expect(manifest.name).toBe("tenants");
  });
});
