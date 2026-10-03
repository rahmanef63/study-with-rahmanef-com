// @vitest-environment node
import { test, expect } from "vitest";
import { userActivityPayload } from "./user-activity-request";
import { learningClickTarget, learningEntrySource } from "./user-activity-client";

const page = { kind: "page", path: "/k/belajar-ai/kelas/dasar-ai/mh70nfayxv1hkhdvhfncbv27wh8a99h3", viewport: "mobile" };
test("authenticated payload accepts the real reader URL and adds only trusted coarse metadata", () => {
  const event = userActivityPayload(page, new Headers({ "user-agent": "Chrome/140 Android", "cf-ipcountry": "US" }), { country: "ID", city: "Bandung" });
  expect(event).toMatchObject({ browser: "Chrome", os: "Android", country: "ID", city: "Bandung", path: page.path });
  for (const key of ["userId", "at", "serverSecret", "country", "city", "browser", "os", "rawIp"]) expect(userActivityPayload({ ...page, [key]: "spoofed" }, new Headers(), null)).toBeNull();
  for (const raw of [{ ...page, path: "/admin" }, { ...page, path: "/?token=private" }, { ...page, referrerHost: [] }, { ...page, target: "https://example.com" }, { ...page, viewport: "other" }]) expect(userActivityPayload(raw, new Headers(), null)).toBeNull();
});
test("link clicks strip queries/fragments and reject private or credential-bearing destinations", () => {
  const origin = "https://study-with.rahmanef.com";
  expect(learningClickTarget("/k/belajar-ai/materi/prompt?secret=x#part", origin)).toBe("/k/belajar-ai/materi/prompt");
  expect(learningClickTarget("https://docs.example.com/guide?key=x#part", origin)).toBe("https://docs.example.com/guide");
  for (const href of ["/pengaturan/mcp", "/admin", "/api/auth/callback", "javascript:alert(1)", "mailto:user@example.com", "https://user:password@example.com/guide", "https://example.com/oauth/callback", "http://example.com/guide"]) expect(learningClickTarget(href, origin)).toBeNull();
});
test("entry attribution survives sign-in without storing raw referrer URL or URL parameters", () => {
  const map = new Map<string, string>();
  const storage = { getItem: (key: string) => map.get(key) ?? null, setItem: (key: string, value: string) => { map.set(key, value); }, removeItem: (key: string) => { map.delete(key); } } as Storage;
  const source = learningEntrySource("?utm_source=youtube&utm_campaign=course&token=secret", "https://youtube.com/watch?private=secret", "https://study-with.rahmanef.com", storage, 100);
  expect(source).toEqual({ referrerHost: "youtube.com", utmSource: "youtube", utmCampaign: "course" });
  expect(learningEntrySource("", "https://accounts.google.com/oauth", "https://study-with.rahmanef.com", storage, 200)).toEqual(source);
  expect(learningEntrySource("", "https://youtube.com/watch", "https://study-with.rahmanef.com", storage, 300)).toEqual(source);
  expect(learningEntrySource("?utm_source=youtube&utm_campaign=course", "https://youtube.com/watch", "https://study-with.rahmanef.com", storage, 1_700_000)).toEqual(source);
  expect(JSON.stringify([...map.values()])).not.toMatch(/secret|watch|token/);
  expect(learningEntrySource("", "https://youtube.com/watch?private=x", "https://study-with.rahmanef.com", storage, 1_800_101)).toEqual({});
  expect(learningEntrySource("?utm_source=youtube&utm_campaign=course", "https://youtube.com/watch", "https://study-with.rahmanef.com", storage, 1_800_102)).toEqual({});
  expect(learningEntrySource("?utm_source=discord&utm_campaign=new-course", "", "https://study-with.rahmanef.com", storage, 1_800_103)).toMatchObject({ utmSource: "discord", utmCampaign: "new-course" });
});
