// Authenticated member smoke — jalan di project "chromium-auth"
// (playwright.config.ts), yaitu HANYA bila kamu sudah merekam
// e2e/.auth/user.json (resep: e2e/auth.setup.ts). READ-ONLY: tidak ada spec
// yang menulis data — aman untuk akun sungguhan; meski begitu, prod DITOLAK
// kecuali E2E_ALLOW_PROD_AUTH=1 (kebijakan e2e/README.md: authed = lokal/staging).
//
// Ditulis ulang untuk rute komunitas (/k/<tenant>/…) setelah OS desktop dihapus.
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

test.describe("community routes — member (storage state)", () => {
  test("A1. sesi hidup: header komunitas menampilkan peran, bukan tombol Masuk", async ({
    page,
  }) => {
    await page.goto(`/k/${TENANT}`);
    await expect(page.getByRole("heading", { name: "Mulai belajar di sini." })).toBeVisible();
    // JoinButton punya tiga state; untuk member ia merender RoleChip, bukan
    // link login. State kedaluwarsa ⇒ spec ini gagal = sinyal rekam ulang.
    await expect(page.getByRole("link", { name: /^Masuk$/ })).toHaveCount(0, {
      timeout: DATA_TIMEOUT,
    });
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
    await expect(page.getByText("Pencarian untuk anggota")).toHaveCount(0);
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
    const modul = page.locator('section[aria-label="Modul"]');
    await expect(modul).toBeVisible({ timeout: DATA_TIMEOUT });
    await modul.locator("a[href*='/kelas/']").first().click();
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
