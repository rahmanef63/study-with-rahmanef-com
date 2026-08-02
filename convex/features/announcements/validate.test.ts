/// <reference types="vite/client" />
// announcements — pure helper unit specs (no ctx): validation bounds, the safe
// projection shape, and the Discord message formatter's truncation.
import { ConvexError } from "convex/values";
import { expect, test } from "vitest";
import {
  ANNOUNCEMENT_LIMITS,
  formatDiscordMessage,
  toAnnouncementView,
  validateCreateInput,
} from "./validate";

test("validateCreateInput trims and accepts valid input", () => {
  expect(validateCreateInput("  Judul  ", "  Isi pengumuman  ")).toEqual({
    title: "Judul",
    bodyMd: "Isi pengumuman",
  });
});

test("validateCreateInput rejects out-of-bounds title/body with VALIDATION_FAILED", () => {
  const tooShort = "ab";
  const tooLongTitle = "x".repeat(ANNOUNCEMENT_LIMITS.titleMax + 1);
  const tooLongBody = "y".repeat(ANNOUNCEMENT_LIMITS.bodyMax + 1);
  for (const [title, body] of [
    [tooShort, "Isi"],
    [tooLongTitle, "Isi"],
    ["Judul sah", ""],
    ["Judul sah", tooLongBody],
  ] as const) {
    try {
      validateCreateInput(title, body);
      throw new Error("expected VALIDATION_FAILED");
    } catch (e) {
      expect(e).toBeInstanceOf(ConvexError);
      expect((e as ConvexError<{ code: string }>).data.code).toBe("VALIDATION_FAILED");
    }
  }
});

test("formatDiscordMessage embeds title + tenant and truncates a long body", () => {
  const short = formatDiscordMessage("Judul", "Isi", "Komunitas");
  expect(short).toContain("**Judul**");
  expect(short).toContain("— Komunitas");
  expect(short).toContain("Isi");

  const long = formatDiscordMessage("T", "z".repeat(5000), "K");
  expect(long).toContain("…");
  expect(long.length).toBeLessThan(1700); // well under Discord's 2000-char cap
});

test("toAnnouncementView exposes exactly the safe fields", () => {
  const now = Date.now();
  const view = toAnnouncementView({
    _id: "a1" as never,
    _creationTime: now,
    tenantId: "t1" as never,
    title: "Judul",
    bodyMd: "Isi",
    createdBy: "u1" as never,
    postedToDiscord: true,
  });
  expect(Object.keys(view).sort()).toEqual(
    ["_id", "bodyMd", "createdAt", "createdBy", "postedToDiscord", "tenantId", "title"].sort()
  );
  expect(view.createdAt).toBe(now);
});
