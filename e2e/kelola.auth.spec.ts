// Authenticated INSTRUCTOR coverage of Kelola — the authoring console for
// materi and skills. Never verified from a browser before: every read behind
// it is instructor+, the console is one client island with local-state tabs
// (so there is no URL to smoke anonymously), and the block-editor route is
// reachable only from inside it.
//
// Runs in the "chromium-auth" project, registered only when e2e/.auth/user.json
// exists (recipe: e2e/README.md). No recorded session ⇒ this file is matched by
// no project and the suite stays anon-only.
//
// READ-ONLY, and here that takes care: this console is the one place in the app
// where a stray click WRITES. So the specs open dialogs and close them with
// Escape, never press Simpan / Terbitkan / Hapus, and never type into the block
// editor (it autosaves). Nothing in this file needs a cleanup step because
// nothing in it creates a row. Prod is refused unless E2E_ALLOW_PROD_AUTH=1.
//
// C1–C4. Siblings: member.auth.spec.ts (A1–A5), library.auth.spec.ts (B1–B7).
import { test, expect, type Page } from "@playwright/test";
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

/**
 * Open the console and answer the only question that decides whether the rest
 * of this file can run: is the RECORDED SESSION an instructor or owner here?
 *
 * A plain member gets "Khusus pengajar" — correct behaviour, not a failure, so
 * the authoring specs skip with a reason instead of going red on someone else's
 * account. (`member.auth.spec.ts` A1 is what fails when the session is dead.)
 */
async function openKelola(page: Page): Promise<boolean> {
  await page.goto(`/k/${TENANT}/kelola`);
  const tabs = page.getByRole("tablist", { name: "Menu kelola" });
  const denied = page.getByText(/Khusus pengajar|Masuk untuk mengelola/);
  await expect(tabs.or(denied).first()).toBeVisible({ timeout: DATA_TIMEOUT });
  return (await tabs.count()) > 0;
}

const NOT_INSTRUCTOR =
  "Sesi yang direkam bukan instruktur/owner di komunitas ini — konsol Kelola memang tertutup untuknya.";

test.describe("kelola — authoring console (storage state)", () => {
  test("C1. the console opens with its six tabs for an instructor", async ({ page }) => {
    const canManage = await openKelola(page);
    test.skip(!canManage, NOT_INSTRUCTOR);

    const tabs = page.getByRole("tablist", { name: "Menu kelola" });
    for (const label of ["Kelas", "Skills", "Kuis", "Anggota & peran", "Profil komunitas", "Statistik"]) {
      await expect(tabs.getByRole("tab", { name: label })).toBeVisible();
    }
    // Kelas is the tab the console opens on.
    await expect(tabs.getByRole("tab", { name: "Kelas" })).toHaveAttribute(
      "aria-selected",
      "true"
    );
    await expectNoCrash(page);
  });

  test("C2. Kelola › Skills is a real authoring surface (dialog opens, nothing is saved)", async ({
    page,
  }) => {
    test.skip(!(await openKelola(page)), NOT_INSTRUCTOR);
    await page.getByRole("tab", { name: "Skills" }).click();

    // The one thing this tab has that the Kelas tab does not: a search over
    // the PROMPT text, not just the title.
    await expect(page.getByLabel("Cari skill (judul atau isi prompt)")).toBeVisible({
      timeout: DATA_TIMEOUT,
    });
    // Empty library (today) or rows — both are correct; the door in must exist
    // either way, which is what a would-be author actually needs.
    await expect(page.getByRole("button", { name: "Skill baru" }).first()).toBeVisible();

    // Open the authoring dialog and read it — then LEAVE. Escape, never Simpan.
    await page.getByRole("button", { name: "Skill baru" }).first().click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: DATA_TIMEOUT });
    await expect(dialog.getByText("Skill baru").first()).toBeVisible();
    // A skill is a materi with a PROMPT — the field that makes it one must be
    // on the form, or the tab authors materi under a different name.
    await expect(dialog.getByLabel("Prompt").first()).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();

    await expectNoCrash(page);
  });

  test("C3. Kelola › Kelas drills into a course and shows its materi placements", async ({
    page,
  }) => {
    test.skip(!(await openKelola(page)), NOT_INSTRUCTOR);

    await expect(page.getByRole("heading", { name: "Kelola Kelas" })).toBeVisible({
      timeout: DATA_TIMEOUT,
    });
    const firstCourse = page.locator('main ul li a[href^="#kelola-course-"]').first();
    test.skip((await firstCourse.count()) === 0, "Komunitas ini belum punya kelas untuk dibuka.");
    await firstCourse.click();

    // The drill-down is local state, not a route — so the URL must NOT change.
    // Getting that wrong drops the instructor out of the console (the reason
    // the anchor clicks are cancelled in the capture phase).
    await expect(page).toHaveURL(new RegExp(`/k/${TENANT}/kelola$`));
    await expect(page.getByRole("heading", { name: "Silabus" })).toBeVisible({
      timeout: DATA_TIMEOUT,
    });
    // A kelas is a curated playlist of materi the community owns (DECISIONS
    // #37): the editor must offer placement, not authoring-in-place.
    await expect(page.getByRole("heading", { name: "Tambah materi" })).toBeVisible();
    await expectNoCrash(page);
  });

  test("C4. the block editor route loads for one materi — and writes nothing", async ({
    page,
  }) => {
    // A lessonId, taken from the syllabus: the editor is addressed by id (a
    // draft has no slug yet), and the only UI links to it are on skill rows —
    // of which there are currently none.
    await page.goto(`/k/${TENANT}/kelas/${COURSE}`);
    // `section[aria-label="Silabus"]`, not "Modul". Modules were dropped from
    // the schema in #48 and the section renamed with them; A4 in
    // member.auth.spec.ts was updated then and this one was missed, so C4 sat
    // red against a selector for a table that no longer exists.
    const silabus = page.locator('section[aria-label="Silabus"]');
    await expect(silabus).toBeVisible({ timeout: DATA_TIMEOUT });
    const href = await silabus.locator("a[href*='/kelas/']").first().getAttribute("href");
    const lessonId = (href ?? "").split("/").pop() ?? "";
    test.skip(lessonId === "", "Silabus kelas seeded kosong — tidak ada lessonId untuk diuji.");

    await page.goto(`/k/${TENANT}/kelola/materi/${lessonId}`);
    // The route renders no server-side authz — the editor's own query answers
    // "not found, or you are not a teacher here". Same skip, one code path.
    const denied = page.getByText(/bukan pengajar di komunitas ini/);
    const chrome = page.getByText("Editor materi");
    await expect(chrome.or(denied).first()).toBeVisible({ timeout: DATA_TIMEOUT });
    test.skip((await denied.count()) > 0, NOT_INSTRUCTOR);

    // Autosave indicator, idle. We type nothing, so it must stay saved — a
    // route that comes up "Belum tersimpan" on load is autosaving on mount.
    await expect(page.getByText(/^Tersimpan$/).first()).toBeVisible({ timeout: DATA_TIMEOUT });
    await expect(page.getByText("Belum tersimpan")).toHaveCount(0);
    // The kind strip (SkillPromptPanel) is the editor route's one piece of
    // materi-vs-skill chrome: a materi has NO prompt field here.
    await expect(page.getByLabel("Prompt")).toHaveCount(0);
    await expect(page.getByRole("link", { name: /Kembali ke konsol/ })).toBeVisible();
    await expectNoCrash(page);
  });
});
