// Pure unit specs: prompt builder + turn coalescing + validasi (satu klaster).
import { describe, expect, test } from "vitest";
import { buildSystemPrompt } from "./prompt";
import { coalesceTurns, LESSON_CONTEXT_MAX } from "./validate";

describe("buildSystemPrompt", () => {
  test("tanpa konteks: persona Alfa Bahasa Indonesia, tanpa blok materi", () => {
    const p = buildSystemPrompt();
    expect(p).toContain("Alfa");
    expect(p).toContain("Bahasa Indonesia");
    expect(p).not.toContain("ISI MATERI");
  });

  test("dengan konteks: judul kelas + materi tersemat", () => {
    const p = buildSystemPrompt({
      lessonTitle: "Materi X",
      courseTitle: "Kelas Y",
      contentMd: "Isi penting.",
    });
    expect(p).toContain("Kelas Y");
    expect(p).toContain("Materi X");
    expect(p).toContain("Isi penting.");
  });

  test("contentMd panjang dipotong pada LESSON_CONTEXT_MAX (bounded, P0)", () => {
    const p = buildSystemPrompt({
      lessonTitle: "M",
      courseTitle: "K",
      contentMd: "a".repeat(LESSON_CONTEXT_MAX + 5000),
    });
    expect(p).toContain("materi dipotong");
    // Prompt total tak boleh membengkak melebihi konteks + amplop kecil.
    expect(p.length).toBeLessThan(LESSON_CONTEXT_MAX + 2500);
  });
});

describe("coalesceTurns", () => {
  test("pesan beruntun role sama digabung; mulai dari user", () => {
    const out = coalesceTurns([
      { role: "assistant", text: "sisa konteks lama" },
      { role: "user", text: "a" },
      { role: "user", text: "b" },
      { role: "assistant", text: "c" },
      { role: "user", text: "d" },
    ]);
    expect(out.map((m) => m.role)).toEqual(["user", "assistant", "user"]);
    expect(out[0].text).toBe("a\n\nb");
  });
});
