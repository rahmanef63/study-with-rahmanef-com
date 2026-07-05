// Pure username rules — unit coverage for the normalization/validation SSOT.
import { describe, expect, test } from "vitest";
import {
  isValidUsername,
  normalizeUsername,
  USERNAME_MAX,
  usernameCandidates,
} from "./username";

describe("normalizeUsername", () => {
  test("lowercases and kebab-cases arbitrary input", () => {
    expect(normalizeUsername("Rahman EF 63")).toBe("rahman-ef-63");
    expect(normalizeUsername("budi.san_toso")).toBe("budi-san-toso");
    expect(normalizeUsername("  --Weird__Input--  ")).toBe("weird-input");
  });

  test("strips diacritics via NFKD", () => {
    expect(normalizeUsername("Déwi Ayu")).toBe("dewi-ayu");
    expect(normalizeUsername("Ñandú")).toBe("nandu");
  });

  test("collapses symbol runs into a single hyphen", () => {
    expect(normalizeUsername("a!!!b###c")).toBe("a-b-c");
  });

  test("caps at USERNAME_MAX without trailing hyphen", () => {
    const long = "a".repeat(USERNAME_MAX - 1) + "-suffix";
    const result = normalizeUsername(long);
    expect(result.length).toBeLessThanOrEqual(USERNAME_MAX);
    expect(result.endsWith("-")).toBe(false);
  });

  test("returns empty string when nothing survives", () => {
    expect(normalizeUsername("!!! ???")).toBe("");
  });
});

describe("isValidUsername", () => {
  test("accepts canonical kebab-case within bounds", () => {
    expect(isValidUsername("rahman")).toBe(true);
    expect(isValidUsername("rahman-ef-63")).toBe(true);
    expect(isValidUsername("a1b")).toBe(true);
  });

  test("rejects out-of-bounds lengths", () => {
    expect(isValidUsername("ab")).toBe(false);
    expect(isValidUsername("a".repeat(USERNAME_MAX + 1))).toBe(false);
  });

  test("rejects non-canonical forms", () => {
    expect(isValidUsername("Rahman")).toBe(false);
    expect(isValidUsername("-abc")).toBe(false);
    expect(isValidUsername("abc-")).toBe(false);
    expect(isValidUsername("ab--cd")).toBe(false);
    expect(isValidUsername("a b")).toBe(false);
  });
});

describe("usernameCandidates", () => {
  test("prefers display name, then email local part", () => {
    expect(usernameCandidates("Rahman Ef", "rahmanef63@gmail.com")).toEqual([
      "rahman-ef",
      "rahmanef63",
    ]);
  });

  test("skips invalid candidates (too short after normalize)", () => {
    expect(usernameCandidates("Al", "al2026@x.com")).toEqual(["al2026"]);
  });

  test("falls back when nothing is derivable", () => {
    expect(usernameCandidates(undefined, undefined)).toEqual(["pengguna"]);
    expect(usernameCandidates("!!", "?@x.com")).toEqual(["pengguna"]);
  });
});
