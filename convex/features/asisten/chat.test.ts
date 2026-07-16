/// <reference types="vite/client" />
// Specs action asisten `ask` (#35) — DoD §5.2: authz-denied paths (P0),
// member-gate konteks materi, guard konfigurasi & provider, bounded input.
// fetch di-stub (pola announcements/discord.test.ts); env via vi.stubEnv.
import { afterEach, describe, expect, test, vi } from "vitest";
import { api } from "../../_generated/api";
import { MAX_MESSAGES } from "./validate";
import {
  anthropicOk,
  asUser,
  seedLesson,
  seedTenantFixture,
  setup,
} from "./test.helpers";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

const fn = api.features.asisten.chat.ask;
const HAI = [{ role: "user" as const, text: "Halo Alfa" }];

describe("auth & konfigurasi (P0)", () => {
  test("anonymous → NOT_AUTHENTICATED (auth sebelum apa pun — fetch tak tersentuh)", async () => {
    const t = setup();
    await seedTenantFixture(t);
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(t.action(fn, { messages: HAI })).rejects.toThrow(/NOT_AUTHENTICATED/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("tanpa ANTHROPIC_API_KEY → NOT_FOUND 'belum aktif' (kill-switch global)", async () => {
    const t = setup();
    const fx = await seedTenantFixture(t);
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(
      t.withIdentity(asUser(fx.memberId)).action(fn, { messages: HAI })
    ).rejects.toThrow(/NOT_FOUND/);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("validasi input (bounded, P0)", () => {
  test("riwayat kosong / kepanjangan / pesan raksasa → VALIDATION_FAILED", async () => {
    const t = setup();
    const fx = await seedTenantFixture(t);
    vi.stubEnv("ANTHROPIC_API_KEY", "test-key");
    const as = t.withIdentity(asUser(fx.memberId));
    await expect(as.action(fn, { messages: [] })).rejects.toThrow(/VALIDATION_FAILED/);
    const many = Array.from({ length: MAX_MESSAGES + 1 }, () => HAI[0]);
    await expect(as.action(fn, { messages: many })).rejects.toThrow(/VALIDATION_FAILED/);
    await expect(
      as.action(fn, { messages: [{ role: "user", text: "x".repeat(4001) }] })
    ).rejects.toThrow(/VALIDATION_FAILED/);
  });
});

describe("konteks materi (member-gate di internal query)", () => {
  test("outsider bertanya dengan lessonId → NOT_AUTHORIZED, fetch tak tersentuh", async () => {
    const t = setup();
    const fx = await seedTenantFixture(t);
    const { lessonId } = await seedLesson(t, fx);
    vi.stubEnv("ANTHROPIC_API_KEY", "test-key");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(
      t.withIdentity(asUser(fx.outsiderId)).action(fn, { messages: HAI, lessonId })
    ).rejects.toThrow(/NOT_AUTHORIZED/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("lesson milik kelas DRAFT → NOT_FOUND (draft tak bocor via asisten, P0 §6)", async () => {
    const t = setup();
    const fx = await seedTenantFixture(t);
    const { lessonId } = await seedLesson(t, fx, { status: "draft" });
    vi.stubEnv("ANTHROPIC_API_KEY", "test-key");
    vi.stubGlobal("fetch", vi.fn());
    await expect(
      t.withIdentity(asUser(fx.memberId)).action(fn, { messages: HAI, lessonId })
    ).rejects.toThrow(/NOT_FOUND/);
  });

  test("member + lessonId valid → system prompt memuat isi materi; jawaban diteruskan", async () => {
    const t = setup();
    const fx = await seedTenantFixture(t);
    const { lessonId } = await seedLesson(t, fx, {
      contentMd: "KATA-KUNCI-KONTEKS fotosintesis.",
    });
    vi.stubEnv("ANTHROPIC_API_KEY", "test-key");
    const fetchMock = vi.fn(async () => anthropicOk("Halo! Aku Alfa."));
    vi.stubGlobal("fetch", fetchMock);

    const out = await t
      .withIdentity(asUser(fx.memberId))
      .action(fn, { messages: HAI, lessonId });

    expect(out).toBe("Halo! Aku Alfa.");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toContain("api.anthropic.com");
    const body = JSON.parse(String(init.body));
    expect(body.system).toContain("KATA-KUNCI-KONTEKS");
    expect(body.max_tokens).toBeLessThanOrEqual(1024);
    // Kunci hanya di header — tidak pernah ikut body/jawaban.
    expect(String(init.body)).not.toContain("test-key");
  });
});

describe("provider errors → kode kontrak, tanpa bocoran body provider", () => {
  test("429 → RATE_LIMITED", async () => {
    const t = setup();
    const fx = await seedTenantFixture(t);
    vi.stubEnv("ANTHROPIC_API_KEY", "test-key");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("{\"secret\":\"acct-detail\"}", { status: 429 }))
    );
    await expect(
      t.withIdentity(asUser(fx.memberId)).action(fn, { messages: HAI })
    ).rejects.toThrow(/RATE_LIMITED/);
  });

  test("500 → NOT_FOUND generic (pesan ramah, bukan body provider)", async () => {
    const t = setup();
    const fx = await seedTenantFixture(t);
    vi.stubEnv("ANTHROPIC_API_KEY", "test-key");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("internal provider detail", { status: 500 }))
    );
    const err = await t
      .withIdentity(asUser(fx.memberId))
      .action(fn, { messages: HAI })
      .catch((e: Error) => e.message);
    expect(err).toMatch(/NOT_FOUND/);
    expect(err).not.toContain("internal provider detail");
  });
});
