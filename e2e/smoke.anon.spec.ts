// Anonymous smoke suite over the OS desktop shell deep-links (STATUS row #13).
// Read-only by design: every scenario is an ANON visitor exercising the §6
// etalase surface — no login, no mutation, safe against prod (e2e/README.md).
//
// Selector policy: role/text-based (getByRole/getByText) against the Bahasa
// Indonesia UI copy SSOTs — grounded in slices/os-shell/apps/* + slice
// config/labels at time of writing, so the specs survive markup refactors
// but intentionally break when the copy contract changes.
import { test, expect, type Page, type ConsoleMessage } from "@playwright/test";

// Seeded fixtures (docs/STATUS.md #11: tenant `belajar-ai`, Rahman = owner).
// Env-overridable so staging can point at its own seed without editing specs.
const TENANT = process.env.E2E_TENANT ?? "belajar-ai";
const COURSE = process.env.E2E_COURSE ?? "dasar-ai";
const USERNAME = process.env.E2E_USERNAME ?? "rahman";

// Convex data loads client-side inside windows — first paint is skeletons.
const DATA_TIMEOUT = 15_000;

// Console noise that is not a product defect (network 404s surface as console
// errors; DevTools nudge is informational). Extend deliberately, never broadly.
const CONSOLE_ALLOWLIST = [
  /Failed to load resource/i,
  /React DevTools/i,
  /net::ERR_/i,
];

function collectErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));
  page.on("console", (msg: ConsoleMessage) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    if (CONSOLE_ALLOWLIST.some((re) => re.test(text))) return;
    errors.push(`console.error: ${text}`);
  });
  return errors;
}

/** The shell must never surface the Next.js crash overlay — on ANY scenario. */
async function expectNoCrash(page: Page) {
  await expect(page.getByText(/Application error|Unhandled Runtime Error/)).toHaveCount(0);
}

test.describe("OS shell — anon smoke", () => {
  test("1. desktop shell boots on / (catch-all renders, no console errors)", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto("/");
    // Cold boot auto-opens Beranda (boot-beranda.tsx) — its hero eyebrow is the
    // stable "the shell is alive and rendered a window" marker.
    await expect(
      page.getByText("Komunitas belajar AI · Bahasa Indonesia").first(),
    ).toBeVisible({ timeout: DATA_TIMEOUT });
    await expectNoCrash(page);
    expect(errors, `unexpected console/page errors:\n${errors.join("\n")}`).toEqual([]);
  });

  test("2. deep-link /komunitas/<tenant> opens community window with etalase", async ({ page }) => {
    // KNOWN DEFECT (found by this suite, 2026-07-10, reproduced on prod):
    // KomunitasApp branches on `payload.tenantSlug`, but BOTH deep-links and
    // openApp deliver the slug as `payload.path` (apps/_nav.ts contract) — so
    // /komunitas/<tenant> falls back to the DIRECTORY instead of the community
    // window. This spec asserts the INTENDED behavior and is annotated
    // test.fail; it flips to "unexpected pass" the moment the fix lands.
    // TODO(rr): waiting on os-shell (alpha) — komunitas-app should read the
    // slug via seg(props.payload) like kelas/kelola/profil do; then delete
    // this annotation.
    test.fail(
      true,
      "komunitas-app reads payload.tenantSlug but deep-links deliver payload.path — remove once alpha fixes the payload parsing",
    );
    await page.goto(`/komunitas/${TENANT}`);
    // Etalase kelas section below the tenant profile card (komunitas-app.tsx).
    await expect(page.getByText("Mulai belajar di sini.")).toBeVisible({ timeout: DATA_TIMEOUT });
    // Anon join affordance from tenants labels SSOT ("Login untuk gabung").
    await expect(page.getByText("Login untuk gabung").first()).toBeVisible({
      timeout: DATA_TIMEOUT,
    });
    // Community quick actions prove the window got a real tenant payload.
    await expect(page.getByText("Sumber & usulan")).toBeVisible();
    await expectNoCrash(page);
  });

  test("3. deep-link /kelas/<tenant>/<course> shows the anon silabus", async ({ page }) => {
    await page.goto(`/kelas/${TENANT}/${COURSE}`);
    // CourseOverviewView: Hero eyebrow "Kelas" + the syllabus section, which
    // carries aria-label "Modul" (courses copy SSOT) in both filled and empty
    // ("Silabus belum diisi") states — anon etalase must render either way.
    await expect(page.getByText("Kelas", { exact: true }).first()).toBeVisible({
      timeout: DATA_TIMEOUT,
    });
    await expect(page.locator('section[aria-label="Modul"]')).toBeVisible({
      timeout: DATA_TIMEOUT,
    });
    await expectNoCrash(page);
  });

  test("4. /masuk shows the Google sign-in affordance", async ({ page }) => {
    await page.goto("/masuk");
    await expect(
      page.getByRole("button", { name: /masuk dengan google/i }),
    ).toBeVisible({ timeout: DATA_TIMEOUT });
    await expectNoCrash(page);
  });

  test("5. /profil/<username> renders the public profile + badge wall", async ({ page }) => {
    await page.goto(`/profil/${USERNAME}`);
    // profil-app.tsx MemberProfil header: eyebrow + @username — the window
    // itself must always boot for a deep-linked profile.
    await expect(page.getByText("Profil anggota")).toBeVisible({ timeout: DATA_TIMEOUT });
    await expect(page.getByText(`@${USERNAME}`).first()).toBeVisible({ timeout: DATA_TIMEOUT });
    // Strong assertion: BadgeWall section (aria-label = badgesTitle SSOT
    // "Lencana Kelas") — renders for badge grid and empty state alike. Prod
    // check 2026-07-10: no profile row has username "rahman" yet, so the view
    // shows its not-found state instead; both are valid non-crash renders of
    // the public surface. Point E2E_USERNAME at a seeded public username to
    // exercise the strong branch (data fixture, not a code defect — reported).
    const badgeWall = page.locator('section[aria-label="Lencana Kelas"]');
    const notFound = page.getByText("Profil tidak ditemukan");
    await expect(badgeWall.or(notFound).first()).toBeVisible({ timeout: DATA_TIMEOUT });
    await expectNoCrash(page);
  });

  test("6. protected window /kelola/<tenant> as anon shows a safe gate — never a crash", async ({
    page,
  }) => {
    const errors = collectErrors(page);
    await page.goto(`/kelola/${TENANT}`);
    // Current behavior (verified against prod 2026-07-10): for ANON viewers
    // useMyMembership skips its query while unauthenticated, so kelola-app
    // stays on KelolaSkeleton — the "Khusus pengelola" gate only renders for
    // AUTHENTICATED non-managers. Both are safe (server authz is the real
    // guard); the spec accepts either so it also passes once the anon branch
    // is added.
    // TODO(rr): waiting on os-shell (alpha) — kelola-app anon branch: show a
    // login gate ("Masuk") when !isAuthenticated instead of an endless
    // skeleton; then tighten this to expect the gate text only.
    const gate = page.getByText("Khusus pengelola");
    const skeleton = page.locator('[data-slot="skeleton"]').first();
    await expect(gate.or(skeleton).first()).toBeVisible({ timeout: DATA_TIMEOUT });
    await expectNoCrash(page);
    expect(errors, `gate must render cleanly:\n${errors.join("\n")}`).toEqual([]);
  });
});
