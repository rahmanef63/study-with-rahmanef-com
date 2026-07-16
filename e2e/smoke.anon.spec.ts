// Anonymous smoke suite over the OS desktop shell deep-links (STATUS row #13;
// hardened in #25: annotation flip spec 2, tightened gate spec 6, new specs 7–9).
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
// Default = the REAL prod handle (vps proposal 2026-07-16: "rahman" punya no
// profile row di prod — spec 5 cuma fail-soft; handle nyata mengaktifkan
// branch kuat badge-wall). Override tetap via E2E_USERNAME.
const USERNAME = process.env.E2E_USERNAME ?? "abdurrahman-fakhrul";

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

/** The shell must never surface the Next.js crash overlay — on ANY scenario.
 *  Also treats the app/error.tsx boundary ("Ada yang tidak beres") as a crash:
 *  it replaces the whole desktop, so reaching it means an unhandled client
 *  exception escaped a window (hardening #25). */
async function expectNoCrash(page: Page) {
  await expect(page.getByText(/Application error|Unhandled Runtime Error/)).toHaveCount(0);
  await expect(page.getByText("Ada yang tidak beres")).toHaveCount(0);
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
    // Defect found by this suite 2026-07-10 (payload.tenantSlug vs payload.path)
    // — FIXED by alpha in 5e805af: komunitas-app now reads the slug via
    // seg(props.payload) (verified in source, wave v1.3). Plain assertion again.
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
    // Anon branch shipped (kelola-app.tsx, wave v1.3): when !isAuthenticated the
    // console renders the "Masuk untuk mengelola" login gate instead of an
    // endless skeleton — TIGHTENED (was gate-or-skeleton) to expect the gate
    // only. Copy SSOT: slices/os-shell/apps/kelola-app.tsx KelolaEmpty title.
    await expect(page.getByText("Masuk untuk mengelola")).toBeVisible({
      timeout: DATA_TIMEOUT,
    });
    await expectNoCrash(page);
    expect(errors, `gate must render cleanly:\n${errors.join("\n")}`).toEqual([]);
  });

  test("7. lesson deep-link as anon shows the silabus etalase, never lesson content", async ({
    page,
  }) => {
    const errors = collectErrors(page);
    // kelas-app gates the lesson pane on membership (lessonId !== null && isMember),
    // so an ANON hitting a lesson URL must fall back to the §6 etalase overview —
    // silabus + join CTA — and the lessonId segment must be inert. A garbage id is
    // deliberate: for anon it is never sent to Convex, so ANY id must be safe.
    await page.goto(`/kelas/${TENANT}/${COURSE}/lesson/e2e-bogus-lesson-id`);
    // Same etalase markers as spec 3 (courses copy SSOT): eyebrow + Modul section.
    await expect(page.getByText("Kelas", { exact: true }).first()).toBeVisible({
      timeout: DATA_TIMEOUT,
    });
    await expect(page.locator('section[aria-label="Modul"]')).toBeVisible({
      timeout: DATA_TIMEOUT,
    });
    // Join affordance proves we got the NON-member overview branch
    // (JoinButton → tenants labels SSOT "Login untuk gabung").
    await expect(page.getByText("Login untuk gabung").first()).toBeVisible({
      timeout: DATA_TIMEOUT,
    });
    // Lesson content must be LOCKED for anon: LessonPlayerView is the only
    // YouTube-embed surface (zero-cost law: video = YouTube embed only), so no
    // iframe may exist anywhere on the etalase render.
    await expect(page.locator("iframe")).toHaveCount(0);
    await expectNoCrash(page);
    expect(errors, `anon lesson etalase must render cleanly:\n${errors.join("\n")}`).toEqual([]);
  });

  test("8. /sertifikat/<bogus-id> shows a friendly not-found, never a crash", async ({
    page,
  }) => {
    // Mounted at #27 (sertifikat-app; alpha) — fixme removed. Contract under
    // test (delta's publicGetCertificate): unknown or invalid id → uniform
    // NOT_FOUND (no case leaking) → the profiles-slice SSOT not-found copy
    // (DEFAULT_CERTIFICATE_LABELS.notFoundTitle), zero crash. The bogus id is
    // ANON-safe by design: the server normalizes it and answers NOT_FOUND.
    const errors = collectErrors(page);
    await page.goto("/sertifikat/e2e-bogus-completion-id");
    await expect(page.getByText("Sertifikat tidak ditemukan").first()).toBeVisible({
      timeout: DATA_TIMEOUT,
    });
    await expectNoCrash(page);
    // EXPECTED noise (vps proposal 2026-07-16, accepted): the Convex client
    // console.errors every server-thrown error, so the by-design NOT_FOUND for
    // a bogus id ALWAYS logs against a real backend. Filter that one expected
    // error only — anything else still fails the spec.
    const unexpected = errors.filter(
      (e) => !/NOT_FOUND|Sertifikat tidak ditemukan/.test(e),
    );
    expect(unexpected, `bogus certificate id must fail soft:\n${unexpected.join("\n")}`).toEqual([]);
  });

  test("9. suggestion board (/resources/<tenant>/usulan) as anon shows a login gate — never a crash", async ({
    page,
  }) => {
    // Gate landed at #27 (resources-app anon branch, kelola-app pattern) —
    // test.fail removed. Both tabs are member-only server-side
    // (requireTenantRole), so the whole window login-gates for anon instead of
    // letting the first query throw NOT_AUTHENTICATED into app/error.tsx.
    await page.goto(`/resources/${TENANT}/usulan`);
    // Exact copy SSOT: resources-app.tsx anon-gate EmptyTitle.
    await expect(
      page.getByText("Masuk untuk membuka sumber & usulan").first(),
    ).toBeVisible({ timeout: DATA_TIMEOUT });
    await expectNoCrash(page);
  });
});
