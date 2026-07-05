// Barrel API contract test (DoD §5.3) + metadata pair version sync (§5.4).
// Consumers (app shell, row #9) rely on exactly these exports.
import { describe, expect, test } from "vitest";
import * as barrel from "../index";
import sliceJson from "../slice.json";
import manifest from "../slice.manifest.json";

describe("profiles barrel contract", () => {
  test("components are exported", () => {
    expect(typeof barrel.ProfileSettingsView).toBe("function");
    expect(typeof barrel.ProfileSettingsForm).toBe("function");
  });

  test("hooks are exported", () => {
    expect(typeof barrel.useCurrentProfile).toBe("function");
    expect(typeof barrel.useEnsureProfile).toBe("function");
    expect(typeof barrel.useEnsureProfileOnFirstLogin).toBe("function");
    expect(typeof barrel.useUpdateProfile).toBe("function");
    expect(typeof barrel.useCheckUsername).toBe("function");
  });

  test("username rules are re-exported and behave canonically", () => {
    expect(barrel.normalizeUsername("Rahman EF 63")).toBe("rahman-ef-63");
    expect(barrel.isValidUsername("rahman-ef-63")).toBe(true);
    expect(barrel.isValidUsername("Rahman")).toBe(false);
    expect(barrel.USERNAME_MIN).toBeLessThan(barrel.USERNAME_MAX);
  });

  test("config + labels are exported with full Bahasa copy", () => {
    expect(barrel.profilesFeature.slug).toBe("profiles");
    expect(barrel.profilesFeature.routes?.[0]?.path).toBe("/pengaturan/profil");
    for (const code of barrel.PROFILE_ERROR_CODES) {
      expect(barrel.DEFAULT_PROFILE_LABELS.errors[code]).toBeTruthy();
    }
    expect(typeof barrel.profileErrorCode).toBe("function");
  });
});

describe("slice metadata pair", () => {
  test("versions are in sync (audit:slices contract)", () => {
    expect(sliceJson.version).toBe(manifest.version);
    expect(sliceJson.slug).toBe("profiles");
    expect(manifest.name).toBe("profiles");
  });
});
