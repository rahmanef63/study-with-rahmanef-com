// Pure unit specs for events/validate.ts — no convex-test, no DB. Boundary
// cases live here so the mutation specs stay about authz and writes.
import { describe, expect, test } from "vitest";
import {
  EVENT_LIMITS,
  assertEndsAt,
  assertFutureStart,
  assertRepeatWeekly,
  buildEventPatch,
  isValidLocationUrl,
  normalizeDescription,
  normalizeTitle,
  validateNewEvent,
} from "./validate";

const NOW = 1_800_000_000_000;

describe("normalizeTitle", () => {
  test("trims; 3 and 120 chars pass, 2 and 121 fail", () => {
    expect(normalizeTitle("  Sesi  ")).toBe("Sesi");
    expect(normalizeTitle("abc")).toBe("abc");
    expect(normalizeTitle("x".repeat(EVENT_LIMITS.titleMax))).toHaveLength(EVENT_LIMITS.titleMax);
    expect(() => normalizeTitle("ab")).toThrow(/VALIDATION_FAILED/);
    expect(() => normalizeTitle("x".repeat(EVENT_LIMITS.titleMax + 1))).toThrow(/VALIDATION_FAILED/);
    expect(() => normalizeTitle("     ")).toThrow(/VALIDATION_FAILED/);
  });
});

describe("normalizeDescription", () => {
  test("undefined stays undefined; blank clears; over the cap throws", () => {
    expect(normalizeDescription(undefined)).toBeUndefined();
    expect(normalizeDescription("   ")).toBeUndefined();
    expect(normalizeDescription("  halo  ")).toBe("halo");
    expect(normalizeDescription("x".repeat(EVENT_LIMITS.descriptionMax))).toHaveLength(
      EVENT_LIMITS.descriptionMax
    );
    expect(() => normalizeDescription("x".repeat(EVENT_LIMITS.descriptionMax + 1))).toThrow(
      /VALIDATION_FAILED/
    );
  });
});

describe("isValidLocationUrl — https only (mirrors the Discord-invite validator)", () => {
  test.each([
    ["https://discord.gg/belajar", true],
    ["https://youtube.com/live/abc", true],
    ["http://discord.gg/belajar", false],
    ["javascript:alert(1)", false],
    ["data:text/html,<script>", false],
    ["discord.gg/belajar", false],
    ["https://", false],
    ["https:// spasi.com", false],
  ])("%s → %s", (url, expected) => {
    expect(isValidLocationUrl(url)).toBe(expected);
  });

  test("over the length cap → false", () => {
    expect(isValidLocationUrl(`https://x.id/${"a".repeat(EVENT_LIMITS.locationUrlMax)}`)).toBe(false);
  });
});

describe("time rules", () => {
  test("assertFutureStart: now itself fails, now+1 passes, garbage fails", () => {
    expect(() => assertFutureStart(NOW, NOW)).toThrow(/VALIDATION_FAILED/);
    expect(() => assertFutureStart(NOW + 1, NOW)).not.toThrow();
    for (const bad of [0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() => assertFutureStart(bad, NOW)).toThrow(/VALIDATION_FAILED/);
    }
  });

  test("assertEndsAt: undefined ok, equal fails, +1 passes", () => {
    expect(() => assertEndsAt(NOW, undefined)).not.toThrow();
    expect(() => assertEndsAt(NOW, NOW)).toThrow(/VALIDATION_FAILED/);
    expect(() => assertEndsAt(NOW, NOW - 1)).toThrow(/VALIDATION_FAILED/);
    expect(() => assertEndsAt(NOW, NOW + 1)).not.toThrow();
  });
});

describe("assertRepeatWeekly", () => {
  test("1..12 pass; 0, 13 and fractions fail", () => {
    for (let n = 1; n <= EVENT_LIMITS.maxRepeatWeekly; n++) {
      expect(() => assertRepeatWeekly(n)).not.toThrow();
    }
    for (const bad of [0, -1, 1.5, EVENT_LIMITS.maxRepeatWeekly + 1, Number.NaN]) {
      expect(() => assertRepeatWeekly(bad)).toThrow(/VALIDATION_FAILED/);
    }
  });
});

describe("validateNewEvent", () => {
  test("normalises every field in one pass", () => {
    expect(
      validateNewEvent(
        {
          title: "  Sesi live  ",
          description: "   ",
          startsAt: NOW + 1000,
          endsAt: NOW + 2000,
          locationUrl: "  https://discord.gg/x  ",
        },
        NOW
      )
    ).toEqual({
      title: "Sesi live",
      description: undefined,
      startsAt: NOW + 1000,
      endsAt: NOW + 2000,
      locationUrl: "https://discord.gg/x",
    });
  });
});

describe("buildEventPatch", () => {
  test("empty input → empty patch (everything stays as stored)", () => {
    expect(buildEventPatch({ startsAt: NOW }, {})).toEqual({});
  });

  test("'' clears description and locationUrl", () => {
    expect(buildEventPatch({ startsAt: NOW }, { description: "", locationUrl: "" })).toEqual({
      description: undefined,
      locationUrl: undefined,
    });
  });

  test("past startsAt is allowed on update, unlike create", () => {
    expect(buildEventPatch({ startsAt: NOW }, { startsAt: 1 })).toEqual({ startsAt: 1 });
  });

  test("new startsAt is checked against the STORED endsAt", () => {
    expect(() => buildEventPatch({ startsAt: NOW, endsAt: NOW + 10 }, { startsAt: NOW + 20 })).toThrow(
      /VALIDATION_FAILED/
    );
    expect(() =>
      buildEventPatch({ startsAt: NOW, endsAt: NOW + 10 }, { startsAt: NOW + 20, endsAt: NOW + 30 })
    ).not.toThrow();
  });
});
