// tenants slice — barrel API contract test (DoD §5.3). TYPE-LEVEL against the
// barrel (enforced by `npx tsc --noEmit`), RUNTIME against the alias-free
// modules.
//
// Why type-level for the barrel: the shared vitest.config.mts has no
// `@/features/*` → slices/ alias, so a runtime import of ../index — whose
// AdminTenantQueueView now pulls @/features/responsive-dialog — cannot resolve
// under vitest. `import type` is erased at runtime; those assertions are
// enforced by tsc (DoD §5.1). The runtime block imports the alias-free source
// modules directly (api.ts uses the aliased @convex, config/labels + error-copy
// are pure, slice metadata is JSON).
// TODO(rr): waiting on integrator — add tsconfig-path aliases (vite-tsconfig-
// paths) to vitest.config.mts (proposal in beta's final report), then switch
// the barrel assertions back to a value import of "../index".
import { ConvexError } from "convex/values";
import { describe, expect, expectTypeOf, test } from "vitest";
import type * as Barrel from "../index";
import { tenantsApi } from "../api";
import { DEFAULT_TENANT_LABELS } from "../config/labels";
import { errorToCopy, extractErrorCode } from "../lib/error-copy";
import metadata from "../slice.json";
import manifest from "../slice.manifest.json";

describe("barrel type contract (compile-time, enforced by tsc)", () => {
  test("exports every consumer-facing component, view and hook", () => {
    // v1 (#1) surface
    expectTypeOf<typeof Barrel.TenantHomeView>().toBeFunction();
    expectTypeOf<typeof Barrel.TenantSettingsView>().toBeFunction();
    expectTypeOf<typeof Barrel.JoinButton>().toBeFunction();
    expectTypeOf<typeof Barrel.MembersList>().toBeFunction();
    expectTypeOf<typeof Barrel.TenantProfileCard>().toBeFunction();
    expectTypeOf<typeof Barrel.TenantProfileForm>().toBeFunction();
    expectTypeOf<typeof Barrel.RoleChip>().toBeFunction();
    // v1.1 (#6) surface — alpha mounts these on /buka-komunitas + /admin/komunitas
    expectTypeOf<typeof Barrel.RequestTenantForm>().toBeFunction();
    expectTypeOf<typeof Barrel.AdminTenantQueueView>().toBeFunction();
    // hooks
    expectTypeOf<typeof Barrel.useTenantBySlug>().toBeFunction();
    expectTypeOf<typeof Barrel.useActiveTenants>().toBeFunction();
    expectTypeOf<typeof Barrel.useMyCommunities>().toBeFunction();
    expectTypeOf<typeof Barrel.useMyMembership>().toBeFunction();
    expectTypeOf<typeof Barrel.useTenantMembers>().toBeFunction();
    expectTypeOf<typeof Barrel.useTenantManageView>().toBeFunction();
    expectTypeOf<typeof Barrel.useJoinTenant>().toBeFunction();
    expectTypeOf<typeof Barrel.useUpdateTenantProfile>().toBeFunction();
    expectTypeOf<typeof Barrel.useSetMemberRole>().toBeFunction();
    expectTypeOf<typeof Barrel.useRequestTenant>().toBeFunction();
    expectTypeOf<typeof Barrel.useApproveTenant>().toBeFunction();
    expectTypeOf<typeof Barrel.useRejectTenant>().toBeFunction();
    expectTypeOf<typeof Barrel.useAdminPendingTenants>().toBeFunction();
    expectTypeOf<typeof Barrel.useMyPlatformAdmin>().toBeFunction();
    // key types consumers rely on
    expectTypeOf<Barrel.PendingTenantRequest>().toHaveProperty("owner");
    expectTypeOf<Barrel.PendingTenantRequest>().toHaveProperty("slug");
    expectTypeOf<Barrel.RequestTenantFormValues>().toHaveProperty("slug");
    expect(true).toBe(true); // runtime anchor so the test registers
  });
});

describe("barrel runtime contract (alias-free modules)", () => {
  test("tenantsApi covers every convex function in the contract", () => {
    expect(Object.keys(tenantsApi).sort()).toEqual(
      [
        "approve",
        "getManageView",
        "getMyMembership",
        "getMyPlatformAdmin",
        "getPublicBySlug",
        "join",
        "listActive",
        "listMembers",
        "listMine",
        "listPending",
        "reject",
        "requestTenant",
        "setMemberRole",
        "updateProfile",
      ].sort()
    );
  });

  test("labels ship required Bahasa copy groups (incl. #6 request + adminQueue)", () => {
    expect(Object.keys(DEFAULT_TENANT_LABELS)).toEqual(
      expect.arrayContaining([
        "home",
        "join",
        "roles",
        "members",
        "settings",
        "request",
        "adminQueue",
        "errors",
      ])
    );
    for (const code of [
      "NOT_AUTHENTICATED",
      "NOT_AUTHORIZED",
      "NOT_FOUND",
      "VALIDATION_FAILED",
      "RATE_LIMITED",
      "UNKNOWN",
    ]) {
      expect(DEFAULT_TENANT_LABELS.errors[code]).toBeTruthy();
    }
  });

  test("errorToCopy maps typed codes to Bahasa copy", () => {
    const rateLimited = new ConvexError({ code: "RATE_LIMITED", message: "x" });
    expect(extractErrorCode(rateLimited)).toBe("RATE_LIMITED");
    expect(errorToCopy(rateLimited)).toBe(DEFAULT_TENANT_LABELS.errors.RATE_LIMITED);
    expect(errorToCopy(new Error("random"))).toBe(DEFAULT_TENANT_LABELS.errors.UNKNOWN);
  });

  test("metadata pair versions are in sync (audit:slices)", () => {
    expect(metadata.version).toBe(manifest.version);
    expect(metadata.version).toBe("0.2.0");
    expect(metadata.slug).toBe("tenants");
    expect(manifest.name).toBe("tenants");
  });
});
