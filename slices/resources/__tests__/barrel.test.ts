// Barrel API contract test (DoD §5.3) + metadata pair version sync (§5.4).
// The integrator relies on exactly these exports to mount /t/[slug]/resources
// and /t/[slug]/usulan.
import { ConvexError } from "convex/values";
import { describe, expect, test } from "vitest";
import * as barrel from "../index";
import sliceJson from "../slice.json";
import manifest from "../slice.manifest.json";

describe("resources barrel contract", () => {
  test("mounted views are exported", () => {
    expect(typeof barrel.ResourceBoardView).toBe("function");
    expect(typeof barrel.SuggestionBoxView).toBe("function");
  });

  test("presentational components are exported", () => {
    for (const name of [
      "ResourceCard",
      "ResourceGrid",
      "ResourceReviewRow",
      "ResourceReviewList",
      "ResourceSubmitForm",
      "SuggestionCard",
      "SuggestionList",
      "SuggestionStatusActions",
      "SuggestionSubmitForm",
      "SuggestionVoteButton",
      "StatusBadge",
    ] as const) {
      expect(typeof barrel[name]).toBe("function");
    }
  });

  test("hooks are exported", () => {
    for (const name of [
      "useApprovedResources",
      "usePendingResources",
      "useMyResources",
      "useSubmitResource",
      "useCurateResource",
      "useOpenSuggestions",
      "useMySuggestions",
      "useSubmitSuggestion",
      "useSetSuggestionStatus",
      "useToggleSuggestionVote",
    ] as const) {
      expect(typeof barrel[name]).toBe("function");
    }
  });

  test("lib helpers are exported and behave canonically", () => {
    expect(barrel.isHttpUrl("https://example.com/x")).toBe(true);
    expect(barrel.isHttpUrl("javascript:alert(1)")).toBe(false);
    expect(barrel.isHttpUrl("ftp://example.com")).toBe(false);
    expect(barrel.displayHost("https://example.com/a/b")).toBe("example.com");
    expect(typeof barrel.resourcesErrorMessage).toBe("function");
    expect(typeof barrel.extractResourcesError).toBe("function");
  });

  test("status label + tone maps resolve for every literal", () => {
    expect(barrel.resourceStatusLabel("approved", barrel.RESOURCES_COPY)).toBe(
      barrel.RESOURCES_COPY.statusApproved
    );
    expect(barrel.suggestionStatusLabel("planned", barrel.RESOURCES_COPY)).toBe(
      barrel.RESOURCES_COPY.statusPlanned
    );
    // tones are non-empty theme-token class strings (no hex)
    expect(barrel.resourceStatusTone("rejected")).toMatch(/destructive/);
    expect(barrel.suggestionStatusTone("done").length).toBeGreaterThan(0);
  });

  test("copy override merges over defaults; untouched keys survive", () => {
    expect(barrel.resourcesFeature.slug).toBe("resources");
    const merged = barrel.mergeResourcesCopy({ submit: "Kirim sekarang" });
    expect(merged.submit).toBe("Kirim sekarang");
    expect(merged.boardTitle).toBe(barrel.RESOURCES_COPY.boardTitle);
  });

  test("error mapping resolves typed codes to copy", () => {
    const msg = barrel.resourcesErrorMessage(
      new ConvexError({ code: "RATE_LIMITED", message: "server msg" }),
      barrel.RESOURCES_COPY
    );
    // RATE_LIMITED reuses the server message when present
    expect(msg).toBe("server msg");
    const authMsg = barrel.resourcesErrorMessage(
      new ConvexError({ code: "NOT_AUTHORIZED", message: "x" }),
      barrel.RESOURCES_COPY
    );
    expect(authMsg).toBe(barrel.RESOURCES_COPY.errNotAuthorized);
  });
});

describe("slice metadata pair", () => {
  test("versions are in sync (audit:slices contract)", () => {
    expect(sliceJson.version).toBe(manifest.version);
    expect(sliceJson.slug).toBe("resources");
    expect(manifest.name).toBe("resources");
  });
});
