// Authenticated member smoke (v1.8, STATUS #40) — jalan di project
// "chromium-auth" (playwright.config.ts), yaitu HANYA bila kamu sudah merekam
// e2e/.auth/user.json (resep: e2e/auth.setup.ts). READ-ONLY: tidak ada spec
// yang menulis data — aman untuk akun sungguhan; meski begitu, prod DITOLAK
// kecuali E2E_ALLOW_PROD_AUTH=1 (kebijakan e2e/README.md: authed = lokal/staging).
//
// Selector policy sama dengan smoke.anon.spec.ts: role/teks atas copy SSOT
// Bahasa Indonesia — sengaja pecah bila kontrak copy berubah.
import { test, expect, type Page } from "@playwright/test";

const TENANT = process.env.E2E_TENANT ?? "belajar-ai";
const COURSE = process.env.E2E_COURSE ?? "dasar-ai";
const DATA_TIMEOUT = 15_000;

const IS_PROD = (process.env.E2E_BASE_URL ?? "").includes("study-with.rahmanef.com");
const ALLOW_PROD = process.env.E2E_ALLOW_PROD_AUTH === "1";

test.beforeEach(() => {
  test.skip(
    IS_PROD && !ALLOW_PROD,
    "Authed suite menolak prod (kebijakan README) — set E2E_ALLOW_PROD_AUTH=1 hanya bila sadar risikonya (tetap read-only).",
  );
});

/** Crash guard yang sama dengan suite anon. */
async function expectNoCrash(page: Page) {
  await expect(page.getByText(/Application error|Unhandled Runtime Error/)).toHaveCount(0);
  await expect(page.getByText("Ada yang tidak beres")).toHaveCount(0);
}

test.describe("OS shell — member (storage state)", () => {
  test("A1. sesi hidup: menu-bar/dock TIDAK menawarkan 'Masuk' lagi", async ({ page }) => {
    await page.goto("/");
    // Marker boot (sama dengan spec anon 1) — shell hidup dulu.
    await expect(
      page.getByText("Komunitas belajar AI · Bahasa Indonesia").first(),
    ).toBeVisible({ timeout: DATA_TIMEOUT });
    // Logged-in: chip akun menggantikan tombol "Masuk" di menu-bar status
    // (account.tsx). State kedaluwarsa ⇒ spec ini gagal = sinyal rekam ulang.
    await expect(page.getByRole("button", { name: /^Masuk$/ })).toHaveCount(0, {
      timeout: DATA_TIMEOUT,
    });
    await expectNoCrash(page);
  });

  test("A2. /notifikasi: inbox terbuka (BUKAN gate login)", async ({ page }) => {
    await page.goto("/notifikasi");
    // Hero app notifikasi (notifikasi-app.tsx).
    await expect(page.getByText("Kabar").first()).toBeVisible({ timeout: DATA_TIMEOUT });
    // Anti-gate: copy gate anon TIDAK boleh muncul untuk member.
    await expect(page.getByText("Masuk untuk melihat notifikasi")).toHaveCount(0, {
      timeout: DATA_TIMEOUT,
    });
    await expectNoCrash(page);
  });

  test("A3. /cari/<tenant>: SearchView tampil untuk member; ketik → hasil/empty tanpa crash", async ({
    page,
  }) => {
    await page.goto(`/cari/${TENANT}`);
    // Member melewati gate ("Masuk untuk mencari" tidak tampil) dan input siap.
    const input = page.getByLabel("Kata kunci pencarian");
    await expect(input).toBeVisible({ timeout: DATA_TIMEOUT });
    await expect(page.getByText("Masuk untuk mencari")).toHaveCount(0);
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

  test("A4. lesson pertama kelas seeded: player member terbuka + form diskusi hadir", async ({
    page,
  }) => {
    // Masuk lewat overview kelas → klik materi pertama di silabus (aria-label
    // "Modul" — courses copy SSOT), supaya tidak bergantung pada lessonId env.
    await page.goto(`/kelas/${TENANT}/${COURSE}`);
    const modul = page.locator('section[aria-label="Modul"]');
    await expect(modul).toBeVisible({ timeout: DATA_TIMEOUT });
    const firstLesson = modul.locator("a[href*='/lesson/'], button").first();
    await firstLesson.click();
    // Member view: diskusi per materi ter-mount (comments slice) — anon tidak
    // pernah melihat ini (spec anon 7 menegaskan kebalikannya).
    await expect(page.getByText(/Diskusi/i).first()).toBeVisible({ timeout: DATA_TIMEOUT });
    await expectNoCrash(page);
  });

  test("A5. Beranda: bagian 'Lanjutkan belajar' muncul bila punya progres (lintas perangkat, #37)", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(
      page.getByText("Komunitas belajar AI · Bahasa Indonesia").first(),
    ).toBeVisible({ timeout: DATA_TIMEOUT });
    // Longgar by design: akun tanpa progres sah-sah saja (section tak render).
    // Kontraknya: BILA render, judulnya benar dan tidak crash.
    const resume = page.locator('section[aria-label="Lanjutkan belajar"]');
    if ((await resume.count()) > 0) {
      await expect(resume.getByText("Lanjutkan belajar").first()).toBeVisible();
    }
    await expectNoCrash(page);
  });
});
