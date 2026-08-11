// Authenticated member smoke — jalan di project "chromium-auth"
// (playwright.config.ts), yaitu HANYA bila kamu sudah merekam
// e2e/.auth/user.json (resep: e2e/README.md). READ-ONLY: tidak ada spec
// yang menulis data — aman untuk akun sungguhan; meski begitu, prod DITOLAK
// kecuali E2E_ALLOW_PROD_AUTH=1 (kebijakan e2e/README.md: authed = lokal/staging).
//
// A1–A5 = fondasi sesi (sesi hidup, notifikasi, cari, player materi, diskusi).
// Perpustakaan materi/skills ada di library.auth.spec.ts (B1–B7); konsol
// Kelola di kelola.auth.spec.ts (C1–C4).
//
// Selector policy sama dengan smoke.anon.spec.ts: role/teks atas copy SSOT
// Bahasa Indonesia — sengaja pecah bila kontrak copy berubah. (A1/A4 memang
// pernah pecah begitu: heading "Mulai belajar di sini." dan
// section[aria-label="Modul"] sudah dihapus dari produk, jadi assertion-nya
// diganti ke marker yang sekarang benar-benar ada.)
import { test, expect } from "@playwright/test";
import {
  COURSE,
  DATA_TIMEOUT,
  DENY_PROD_AUTH,
  DENY_PROD_AUTH_REASON,
  TENANT,
  expectNoCrash,
} from "./helpers";

test.beforeEach(() => {
  test.skip(DENY_PROD_AUTH, DENY_PROD_AUTH_REASON);
});

test.describe("community routes — member (storage state)", () => {
  test("A1. sesi hidup: header komunitas menyapa anggota, bukan menawarkan login", async ({
    page,
  }) => {
    await page.goto(`/k/${TENANT}`);
    // JoinButton punya tiga state; untuk member ia merender "Kamu sudah
    // bergabung" + RoleChip. State kedaluwarsa ⇒ spec ini gagal = sinyal rekam
    // ulang (itu SATU-SATUNYA prosedur refresh — lihat e2e/README.md).
    await expect(page.getByText("Kamu sudah bergabung").first()).toBeVisible({
      timeout: DATA_TIMEOUT,
    });
    await expect(page.getByRole("link", { name: "Login untuk gabung" })).toHaveCount(0);
    await expectNoCrash(page);
  });

  test("A2. /notifikasi: inbox terbuka (BUKAN gate login)", async ({ page }) => {
    await page.goto("/notifikasi");
    await expect(page.getByText("Masuk untuk melihat notifikasi")).toHaveCount(0, {
      timeout: DATA_TIMEOUT,
    });
    await expectNoCrash(page);
  });

  test("A3. /k/<tenant>/cari: SearchView tampil untuk member; ketik → hasil/empty tanpa crash", async ({
    page,
  }) => {
    await page.goto(`/k/${TENANT}/cari`);
    const input = page.getByLabel("Kata kunci pencarian");
    await expect(input).toBeVisible({ timeout: DATA_TIMEOUT });
    await input.fill("ai");
    // Hasil ATAU empty-state — dua-duanya valid; yang haram: crash/error page.
    await expect(
      page
        .getByText("Tidak ada hasil")
        .or(page.locator('a[aria-label^="Buka"], button[aria-label^="Buka"]').first())
        .first(),
    ).toBeVisible({ timeout: DATA_TIMEOUT });
    await expectNoCrash(page);
  });

  test("A4. materi pertama kelas seeded: player member terbuka + diskusi hadir", async ({
    page,
  }) => {
    // Masuk lewat silabus → klik materi pertama, supaya tidak bergantung pada
    // lessonId env. Di rute nyata ini navigasi biasa, bukan state window.
    await page.goto(`/k/${TENANT}/kelas/${COURSE}`);
    const silabus = page.locator('section[aria-label="Silabus"]');
    await expect(silabus).toBeVisible({ timeout: DATA_TIMEOUT });
    await silabus.locator("a[href*='/kelas/']").first().click();
    await expect(page).toHaveURL(new RegExp(`/k/${TENANT}/kelas/${COURSE}/.+`));
    // Member view: diskusi per materi ter-mount (comments slice) — anon tidak
    // pernah melihat ini (spec anon 7 menegaskan kebalikannya).
    await expect(page.getByText(/Diskusi/i).first()).toBeVisible({ timeout: DATA_TIMEOUT });
    await expectNoCrash(page);
  });

  test("A5. Diskusi terbuka untuk member (bukan gate gabung)", async ({ page }) => {
    await page.goto(`/k/${TENANT}/diskusi`);
    await expect(page.getByText("Gabung komunitasnya dulu")).toHaveCount(0, {
      timeout: DATA_TIMEOUT,
    });
    await expectNoCrash(page);
  });
});
