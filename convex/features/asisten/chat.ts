// asisten feature — action `ask` (#35): satu giliran chat dengan Alfa.
// Default (V8) action runtime — fetch tersedia tanpa "use node" (pola
// announcements/discord.ts), jadi tetap teruji via convex-test.
// P0 contract: v.* validators + auth sebagai LANGKAH PERTAMA (getAuthUserId —
// requireUser di _shared bertipe Query/MutationCtx, action memakai primitive
// yang sama). Konteks materi diambil via INTERNAL query yang meng-enforce
// membership + published (context.ts) — action tidak menyentuh db langsung.
//
// Biaya (keputusan owner 2026-07-16, dicatat STATUS #35): TANPA kuota per-user
// di v1 — pengaman yang tetap aktif: login wajib, bound riwayat/panjang pesan
// (validate.ts), max_tokens jawaban, model Haiku termurah, dan kill-switch
// global = unset ANTHROPIC_API_KEY (asisten balik ke "belum aktif").
// Secret: kunci HANYA dibaca dari env di server; tak pernah menyeberang wire.
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { makeFunctionReference } from "convex/server";
import { action } from "../../_generated/server";
import { fail } from "./errors";
import { buildSystemPrompt, type LessonContext } from "./prompt";
import {
  assertMessages,
  coalesceTurns,
  MAX_OUTPUT_TOKENS,
  MODEL,
  type WireMessage,
} from "./validate";

// Typed ref (pola notifications/refs.ts): AnyApi api.d.ts yang ter-commit tidak
// menjamin namespace internal.* — path string adalah kontraknya.
const lessonContextRef = makeFunctionReference<
  "query",
  { lessonId: string; userId: string },
  LessonContext
>("features/asisten/context:lessonContext");

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";

export const ask = action({
  args: {
    messages: v.array(
      v.object({
        role: v.union(v.literal("user"), v.literal("assistant")),
        text: v.string(),
      })
    ),
    /** Opsional: id materi yang sedang dibuka — jadi konteks tutor. */
    lessonId: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<string> => {
    const userId = await getAuthUserId(ctx); // auth FIRST (P0)
    if (userId === null) fail("NOT_AUTHENTICATED", "Silakan login dulu");
    assertMessages(args.messages as WireMessage[]);

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (apiKey === undefined || apiKey.length === 0) {
      // Konfigurasi server, bukan salah pengguna — jangan bocorkan detail env.
      fail("NOT_FOUND", "Asisten belum aktif. Coba lagi nanti, ya.");
    }

    // Konteks materi (member-gated + published-only di internal query).
    let lesson: LessonContext | undefined;
    if (args.lessonId !== undefined) {
      lesson = await ctx.runQuery(lessonContextRef, {
        lessonId: args.lessonId,
        userId,
      });
    }

    const turns = coalesceTurns(args.messages as WireMessage[]);
    const response = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": ANTHROPIC_VERSION,
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_OUTPUT_TOKENS,
        system: buildSystemPrompt(lesson),
        messages: turns.map((m) => ({ role: m.role, content: m.text })),
      }),
    });

    if (!response.ok) {
      // Jangan teruskan body error provider ke client (bisa memuat detail akun).
      if (response.status === 429 || response.status === 529) {
        fail("RATE_LIMITED", "Alfa lagi ramai. Tunggu sebentar lalu coba lagi.");
      }
      fail("NOT_FOUND", "Alfa tidak bisa dihubungi sekarang. Coba lagi nanti.");
    }

    const data = (await response.json()) as {
      content?: Array<{ type: string; text?: string }>;
    };
    const text = (data.content ?? [])
      .filter((b) => b.type === "text" && typeof b.text === "string")
      .map((b) => b.text)
      .join("");
    if (text.length === 0) {
      fail("NOT_FOUND", "Alfa tidak memberi jawaban. Coba ulangi pertanyaanmu.");
    }
    return text;
  },
});
