// Barrel API contract test (DoD §5.3) — TYPE-LEVEL via the barrel, RUNTIME via
// alias-free modules (precedent: slices/search barrel test; value-importing the
// barrel breaks under vitest because of transitive @/components/ui/* imports).
import { describe, expect, expectTypeOf, test } from "vitest";
import type * as Barrel from "../index";
import { asistenFeature } from "../config";
import { ASISTEN_COPY, mergeAsistenCopy } from "../config/copy";
import { MAX_MESSAGES, MAX_TEXT } from "../config/limits";
import {
  MAX_MESSAGES as SERVER_MAX_MESSAGES,
  MAX_TEXT as SERVER_MAX_TEXT,
} from "@convex/features/asisten/validate";
import sliceJson from "../slice.json";
import manifest from "../slice.manifest.json";

describe("barrel type contract (compile-time, enforced by tsc)", () => {
  test("exports view, component, hooks, and wire types", () => {
    expectTypeOf<typeof Barrel.AsistenChatView>().toBeFunction();
    expectTypeOf<Barrel.AsistenChatViewProps>().toHaveProperty("lessonId");
    expectTypeOf<typeof Barrel.AsistenMessageBubble>().toBeFunction();
    expectTypeOf<typeof Barrel.useAsistenChat>().toBeFunction();
    expectTypeOf<typeof Barrel.asistenErrorCode>().toBeFunction();
    // Seam appshell useChat: (messages) => AsyncGenerator<string>.
    expectTypeOf<Barrel.AsistenChatFn>().toEqualTypeOf<
      (messages: Barrel.AsistenMessage[]) => AsyncGenerator<string>
    >();
    expectTypeOf<Barrel.AsistenMessage["role"]>().toEqualTypeOf<"user" | "assistant">();
    expect(true).toBe(true); // runtime anchor
  });
});

describe("barrel runtime contract (alias-free modules)", () => {
  test("feature descriptor + metadata pair versions in sync (audit:slices)", () => {
    expect(asistenFeature.slug).toBe("asisten");
    expect(sliceJson.version).toBe(manifest.version);
    expect(sliceJson.slug).toBe("asisten");
    expect(manifest.name).toBe("asisten");
  });

  test("limits mirror the server bounds (SSOT: convex validate.ts)", () => {
    expect(MAX_MESSAGES).toBe(SERVER_MAX_MESSAGES);
    expect(MAX_TEXT).toBe(SERVER_MAX_TEXT);
  });

  test("copy defaults are Bahasa Indonesia; merge overrides", () => {
    expect(ASISTEN_COPY.title).toContain("Alfa");
    for (const [k, v] of Object.entries(ASISTEN_COPY)) {
      if (Array.isArray(v)) {
        expect(v.length).toBeGreaterThan(0);
      } else {
        expect(typeof v).toBe("string");
        expect((v as string).length).toBeGreaterThan(0);
      }
      expect(k.length).toBeGreaterThan(0);
    }
    const merged = mergeAsistenCopy({ send: "Gaskan" });
    expect(merged.send).toBe("Gaskan");
    expect(merged.title).toBe(ASISTEN_COPY.title);
  });
});
