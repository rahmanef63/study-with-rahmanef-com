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

describe("public profile barrel contract (STATUS #9)", () => {
  test("public components + hook are exported", () => {
    expect(typeof barrel.PublicProfileView).toBe("function");
    expect(typeof barrel.PublicProfileCard).toBe("function");
    expect(typeof barrel.BadgeWall).toBe("function");
    expect(typeof barrel.ProfileAvatar).toBe("function");
    expect(typeof barrel.usePublicProfile).toBe("function");
  });

  test("public labels are exported with full Bahasa copy (every key non-empty)", () => {
    const labels = barrel.DEFAULT_PUBLIC_PROFILE_LABELS;
    for (const value of Object.values(labels)) {
      expect(typeof value).toBe("string");
      expect(value.length).toBeGreaterThan(0);
    }
    // Spot-check a couple of contract keys exist.
    expect(labels.notFoundTitle).toBeTruthy();
    expect(labels.badgesTitle).toBeTruthy();
    expect(labels.copyLabel).toBeTruthy();
  });
});

describe("certificate barrel contract (STATUS #24)", () => {
  test("certificate components + hook are exported", () => {
    expect(typeof barrel.CertificateView).toBe("function");
    expect(typeof barrel.CertificateCard).toBe("function");
    expect(typeof barrel.useCertificate).toBe("function");
  });

  test("certificate labels are exported with full Bahasa copy (every key non-empty)", () => {
    const labels = barrel.DEFAULT_CERTIFICATE_LABELS;
    for (const value of Object.values(labels)) {
      expect(typeof value).toBe("string");
      expect(value.length).toBeGreaterThan(0);
    }
    // Spot-check contract keys the host relies on.
    expect(labels.notFoundTitle).toBeTruthy();
    expect(labels.heading).toBeTruthy();
    expect(labels.copyLabel).toBeTruthy();
  });
});

describe("slice metadata pair", () => {
  test("versions are in sync (audit:slices contract)", () => {
    expect(sliceJson.version).toBe(manifest.version);
    expect(sliceJson.slug).toBe("profiles");
    expect(manifest.name).toBe("profiles");
  });
});
