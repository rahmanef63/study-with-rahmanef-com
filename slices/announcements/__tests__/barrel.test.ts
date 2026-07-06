// Barrel API contract test (DoD §5.3) + metadata pair version sync (§5.4).
// The integrator (mounting /t/[slug]/pengumuman) relies on exactly these exports.
import { ConvexError } from "convex/values";
import { describe, expect, test } from "vitest";
import * as barrel from "../index";
import sliceJson from "../slice.json";
import manifest from "../slice.manifest.json";

describe("announcements barrel contract", () => {
  test("connected view is exported", () => {
    expect(typeof barrel.AnnouncementsView).toBe("function");
  });

  test("presentational components are exported", () => {
    expect(typeof barrel.AnnouncementCard).toBe("function");
    expect(typeof barrel.AnnouncementForm).toBe("function");
  });

  test("hooks are exported", () => {
    expect(typeof barrel.useAnnouncements).toBe("function");
    expect(typeof barrel.useCreateAnnouncement).toBe("function");
  });

  test("convex function refs are exported (list + create)", () => {
    expect(barrel.announcementsApi.list).toBeDefined();
    expect(barrel.announcementsApi.create).toBeDefined();
  });

  test("config + copy are exported with full Bahasa copy", () => {
    expect(barrel.announcementsFeature.slug).toBe("announcements");
    expect(barrel.ANNOUNCEMENTS_COPY.submit).toBeTruthy();
    // Override merges over defaults; untouched keys survive.
    const merged = barrel.mergeAnnouncementsCopy({ submit: "Publikasikan" });
    expect(merged.submit).toBe("Publikasikan");
    expect(merged.title).toBe(barrel.ANNOUNCEMENTS_COPY.title);
  });

  test("error mapping resolves typed codes to copy", () => {
    const msg = barrel.announcementErrorMessage(
      new ConvexError({ code: "NOT_AUTHORIZED", message: "x" }),
      barrel.ANNOUNCEMENTS_COPY
    );
    expect(msg).toBe(barrel.ANNOUNCEMENTS_COPY.errNotAuthorized);
    // VALIDATION_FAILED surfaces the (user-facing) server message.
    const v = barrel.announcementErrorMessage(
      new ConvexError({ code: "VALIDATION_FAILED", message: "Judul terlalu pendek" }),
      barrel.ANNOUNCEMENTS_COPY
    );
    expect(v).toBe("Judul terlalu pendek");
  });
});

describe("slice metadata pair", () => {
  test("versions are in sync (audit:slices contract)", () => {
    expect(sliceJson.version).toBe(manifest.version);
    expect(sliceJson.slug).toBe("announcements");
    expect(manifest.name).toBe("announcements");
  });
});
