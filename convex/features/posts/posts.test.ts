/// <reference types="vite/client" />
// Mutation specs for the posts feature (v1.8 #29/#33). DoD §5.2 (P0): every
// mutation exercises the authz-DENIED paths (unauthenticated + wrong role),
// plus the assignment's named cases: pengumuman gate, counter seeding, edit
// cannot escalate `kind`, soft-delete semantics, instructor-only pin, and the
// MANDATORY per-user daily anti-spam cap (DECISIONS #33).
import { afterEach, describe, expect, test, vi } from "vitest";
import { api } from "../../_generated/api";
import type { Id } from "../../_generated/dataModel";
import {
  DAY_MS,
  MAX_LINK_POSTS_PER_DAY,
  MAX_POSTS_PER_DAY,
} from "./antiSpam";
import { asUser, seedPost, seedTenantFixture, setup } from "./test.helpers";

const LINK = "https://contoh.id/artikel";

async function fixture() {
  const t = setup();
  const fx = await seedTenantFixture(t);
  return { t, fx };
}

afterEach(() => {
  vi.useRealTimers();
});

describe("create — authz", () => {
  test("anonymous → NOT_AUTHENTICATED", async () => {
    const { t, fx } = await fixture();
    await expect(
      t.mutation(api.features.posts.posts.create, {
        tenantId: fx.tenantId,
        kind: "diskusi",
        title: "Halo semua",
        bodyMd: "Perkenalan.",
      })
    ).rejects.toThrow(/NOT_AUTHENTICATED/);
  });

  test("outsider (no membership) and cross-tenant member → NOT_AUTHORIZED", async () => {
    const { t, fx } = await fixture();
    const other = await seedTenantFixture(t, "komunitas-lain");
    const args = {
      tenantId: fx.tenantId,
      kind: "diskusi" as const,
      title: "Halo semua",
      bodyMd: "Perkenalan.",
    };
    await expect(
      t.withIdentity(asUser(fx.outsiderId)).mutation(api.features.posts.posts.create, args)
    ).rejects.toThrow(/NOT_AUTHORIZED/);
    await expect(
      t.withIdentity(asUser(other.memberId)).mutation(api.features.posts.posts.create, args)
    ).rejects.toThrow(/NOT_AUTHORIZED/);
  });

  test("kind 'pengumuman': member → NOT_AUTHORIZED; instructor+ passes", async () => {
    const { t, fx } = await fixture();
    const args = {
      tenantId: fx.tenantId,
      kind: "pengumuman" as const,
      title: "Kelas baru minggu depan",
      bodyMd: "Catat tanggalnya ya.",
    };
    await expect(
      t.withIdentity(asUser(fx.memberId)).mutation(api.features.posts.posts.create, args)
    ).rejects.toThrow(/NOT_AUTHORIZED/);
    expect(
      await t.withIdentity(asUser(fx.instructorId)).mutation(api.features.posts.posts.create, args)
    ).toBeDefined();
  });
});

describe("create — writes & validation", () => {
  test("member post seeds pinned:false and both counters at 0", async () => {
    const { t, fx } = await fixture();
    const id: Id<"posts"> = await t
      .withIdentity(asUser(fx.memberId))
      .mutation(api.features.posts.posts.create, {
        tenantId: fx.tenantId,
        kind: "sumber",
        title: "  Kursus gratis Python  ",
        bodyMd: "  Rekomendasi buat pemula.  ",
        linkUrl: LINK,
        youtubeVideoId: "dQw4w9WgXcQ",
      });
    const row = await t.run((ctx) => ctx.db.get(id));
    expect(row?.tenantId).toBe(fx.tenantId);
    expect(row?.authorId).toBe(fx.memberId);
    expect(row?.title).toBe("Kursus gratis Python"); // trimmed
    expect(row?.bodyMd).toBe("Rekomendasi buat pemula.");
    expect(row?.pinned).toBe(false);
    expect(row?.likeCount).toBe(0);
    expect(row?.commentCount).toBe(0);
    expect(row?.lastActivityAt).toBeTypeOf("number");
  });

  test("bad title / body / link / video id → VALIDATION_FAILED", async () => {
    const { t, fx } = await fixture();
    const as = t.withIdentity(asUser(fx.memberId));
    const base = { tenantId: fx.tenantId, kind: "diskusi" as const };
    await expect(
      as.mutation(api.features.posts.posts.create, { ...base, title: "ab", bodyMd: "Isi" })
    ).rejects.toThrow(/VALIDATION_FAILED/);
    await expect(
      as.mutation(api.features.posts.posts.create, { ...base, title: "Judul oke", bodyMd: "   " })
    ).rejects.toThrow(/VALIDATION_FAILED/);
    await expect(
      as.mutation(api.features.posts.posts.create, {
        ...base,
        title: "Judul oke",
        bodyMd: "Isi",
        linkUrl: "javascript:alert(1)",
      })
    ).rejects.toThrow(/VALIDATION_FAILED/);
    await expect(
      as.mutation(api.features.posts.posts.create, {
        ...base,
        title: "Judul oke",
        bodyMd: "Isi",
        youtubeVideoId: "https://youtu.be/dQw4w9WgXcQ",
      })
    ).rejects.toThrow(/VALIDATION_FAILED/);
  });
});

describe("create — anti-spam (MANDATORY, DECISIONS #33)", () => {
  const newPost = (tenantId: Id<"tenants">, linkUrl?: string) => ({
    tenantId,
    kind: "diskusi" as const,
    title: "Judul yang cukup panjang",
    bodyMd: "Isi post.",
    linkUrl,
  });

  test(`post #${MAX_POSTS_PER_DAY + 1} in 24h → RATE_LIMITED (others unaffected)`, async () => {
    const { t, fx } = await fixture();
    for (let i = 0; i < MAX_POSTS_PER_DAY; i++) {
      await seedPost(t, fx, fx.memberId, { title: `Post ${i}` });
    }
    await expect(
      t.withIdentity(asUser(fx.memberId)).mutation(api.features.posts.posts.create, newPost(fx.tenantId))
    ).rejects.toThrow(/RATE_LIMITED/);
    expect(
      await t
        .withIdentity(asUser(fx.instructorId))
        .mutation(api.features.posts.posts.create, newPost(fx.tenantId))
    ).toBeDefined();
  });

  test(`link post #${MAX_LINK_POSTS_PER_DAY + 1} → RATE_LIMITED while a plain post still passes`, async () => {
    const { t, fx } = await fixture();
    for (let i = 0; i < MAX_LINK_POSTS_PER_DAY; i++) {
      await seedPost(t, fx, fx.memberId, { title: `Tautan ${i}`, linkUrl: LINK });
    }
    const as = t.withIdentity(asUser(fx.memberId));
    await expect(
      as.mutation(api.features.posts.posts.create, newPost(fx.tenantId, LINK))
    ).rejects.toThrow(/RATE_LIMITED/);
    expect(await as.mutation(api.features.posts.posts.create, newPost(fx.tenantId))).toBeDefined();
  });

  test("the cap is a ROLLING 24h window, not a lifetime quota", async () => {
    const { t, fx } = await fixture();
    for (let i = 0; i < MAX_POSTS_PER_DAY; i++) {
      await seedPost(t, fx, fx.memberId, { title: `Post ${i}` });
    }
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(Date.now() + DAY_MS + 1000));
    expect(
      await t.withIdentity(asUser(fx.memberId)).mutation(api.features.posts.posts.create, newPost(fx.tenantId))
    ).toBeDefined();
  });

  test("the cap counts SOFT-DELETED posts — delete-and-repost cannot reset it", async () => {
    const { t, fx } = await fixture();
    for (let i = 0; i < MAX_POSTS_PER_DAY; i++) {
      await seedPost(t, fx, fx.memberId, { title: `Post ${i}`, deletedAt: Date.now() });
    }
    await expect(
      t.withIdentity(asUser(fx.memberId)).mutation(api.features.posts.posts.create, newPost(fx.tenantId))
    ).rejects.toThrow(/RATE_LIMITED/);
  });
});
