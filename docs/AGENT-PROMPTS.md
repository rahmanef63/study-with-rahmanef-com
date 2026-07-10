# Agent Prompts — Wave v1.2 (CURRENT) · fase-2 opening

> Contract: [AGENTS.md](../AGENTS.md) · Board: [STATUS.md](STATUS.md) · UI brief: [UI-UX-PRD.md](UI-UX-PRD.md)
> Wave 1 (#0–#5, #11) & wave v1.1 (#6–#10, #14) done — LIVE: https://study-with.rahmanef.com
> **Frontend = OS desktop shell** (pivot 2026-07-07): satu catch-all mount `slices/appshell` via `slices/os-shell/`; semua permukaan adalah window-app dengan deep-link (`/komunitas/<tenant>`, `/kelas/<tenant>/<course>`, `/profil/<username>`, `/kelola/<tenant>`, …). Convex backend tidak berubah.

## EXECUTION MODE: Cowork parallel (same folder)

1. **Zero shared-file writes.** Worker menulis HANYA di dua direktorinya: `slices/<slug>/` + `convex/features/<slug>/`. Tidak menyentuh `docs/**`, `app/**`, `package.json`, **`slices/os-shell/`**, **`slices/appshell/`**, atau slice lain (termasuk yang kamu bangun di wave lalu untuk assignment berbeda).
2. **The board is alpha's.** Baris sudah di-pre-claim; STATUS.md read-only bagi worker; lapor via chat.
3. **No git.** Alpha verifikasi + commit dengan kredit `Agent: <name>`; Rahman push.
4. Proposals/blockers → final report + `// TODO(rr): ...` di call site.
5. **Tests wajib DITULIS** (DoD §5). Menjalankan: salin folder ke sandbox `/tmp/w` (exclude node_modules), `npm install --legacy-peer-deps` (retry saat timeout), `npx vitest run` + `npx tsc --noEmit`. Gagal install → kirim tests + tandai "not executed".
6. **Selesai = laporan terstruktur di chat**: (a) files, (b) barrel exports, (c) hasil test, (d) proposals/integration points untuk alpha, (e) TODO(rr).
7. Pola referensi: `convex/seed.test.ts` · `convex/features/courses/test.helpers.ts` (fixture role) · `convex/features/courses/authz-order.test.ts` (dangling-id, auth-before-read).
8. **Tulis file di FOLDER PROJECT, bukan /tmp.** /tmp hanya untuk MENJALANKAN test. VERIFIKASI file ada di folder project sebelum lapor.
9. **Schema wave v1.2 SUDAH ditambahkan alpha**: tabel `comments` + `suggestionVotes` ada di `convex/schema.ts` + docs/DATA-MODEL.md. Implement PERSIS; deviasi = ubah DATA-MODEL via alpha DULU.
10. **Convex module naming: camelCase untuk modul non-test di `convex/**`** (Convex melarang `-`; `*.test.ts` bebas). File frontend slice tetap kebab-case.
11. UI copy Bahasa Indonesia; anonymous reads hanya via §6 etalase (`public*` / whitelist). Integrasi window-app/OS = urusan alpha — deliver lewat barrel.

## Assignments — wave v1.2

| Agent | Row | Tugas | Dirs |
|---|---|---|---|
| **beta** | #16 | komentar per lesson (fase-2) | `slices/comments/`, `convex/features/comments/` |
| **gamma** | #17 | analytics instruktur per kelas | `slices/analytics/`, `convex/features/analytics/` |
| **epsilon** | #18 | vote pada usulan | `slices/resources/`, `convex/features/resources/` |
| **zeta** | #13 | e2e smoke Playwright | `e2e/`, `playwright.config.ts` |
| **vps** | #19 | FINAL: deploy v1.2 + **EKSEKUSI ROTASI #12** | server runtime only |

Urutan: 4 worker paralel → alpha review + integrasi window-app + commit → Rahman push → **vps finale**.

---

## Prompt — beta (#16 komentar per lesson)

```
You are agent "beta", one of four parallel Cowork sessions on this same project folder. Isolation: write ONLY inside slices/comments/ and convex/features/comments/. No git. STATUS.md read-only (row #16 pre-claimed; verify #2 and #14 done, else STOP).

Onboarding: CLAUDE.md → AGENTS.md (§1 read order) → mode rules atop docs/AGENT-PROMPTS.md (rule 9: schema `comments` already exists — implement EXACTLY per docs/DATA-MODEL.md).

Assignment — #16, diskusi per lesson:
- Copy-first: study rr `comments` slice (https://resource.rahmanef.com/agents/comments) — threaded pattern, adapter seams; ADAPT to our simpler model, don't lift wholesale.
- Mutations: addComment (member of the lesson's tenant; auth BEFORE the lesson read — pattern courses/access.ts; bodyMd 1..2000 chars; parentId must reference a ROOT comment of the SAME lesson — depth-1 enforced, VALIDATION_FAILED otherwise), softDelete (author OR instructor+; sets deletedAt — never hard-delete).
- Query: listByLesson (member; via by_lesson, bounded take + newest-root-first with replies nested client-side; deleted comments return a placeholder shape {deleted: true} — bodyMd NEVER leaks after deletion, asserted in a test). Join author display via profiles (shared-table read, sanctioned).
- Anti-spam: max 10 comments per user per lesson per session-window is overkill — simple guard: reject if user has >20 comments on the lesson (bounded count via by_lesson take + filter).
- UI via barrel: LessonComments({ lessonId }) — list + form + reply + delete (ResponsiveDialog confirm), Bahasa Indonesia, empty state ramah. Alpha integrates it into the lesson window-app.
- P0s: validators + authz-first; auth-before-read; tenantId always from the LESSON row, never from args.

Done = AGENTS.md §5 (tests: denied paths, depth-1 rejection, soft-delete placeholder shape, cross-tenant rejection). Structured final report, then stop.
```

## Prompt — gamma (#17 analytics instruktur)

```
You are agent "gamma", one of four parallel Cowork sessions on this same project folder. Isolation: write ONLY inside slices/analytics/ and convex/features/analytics/. No git. STATUS.md read-only (row #17 pre-claimed; verify #3 and #8 done, else STOP).

Onboarding: CLAUDE.md → AGENTS.md (§1 read order) → mode rules atop docs/AGENT-PROMPTS.md. NO new tables — this feature is read-only aggregates over shared tables (sanctioned precedent: progress/profiles).

Assignment — #17, analytics per kelas untuk instructor+ (deferred from #3: "agregat instructor+"):
- Query getCourseAnalytics (requireUser → course read → requireTenantRole(instructor) — auth-before-read): per lesson completion counts (lessonCompletions.by_course, bounded take ≤5000 + aggregate in-handler), courseCompletions count, member count of tenant (memberships.by_tenant bounded), quiz stats per module (attempts via by_quiz: attempts count, pass count → rate).
- Query listCourseSummaries (instructor+; per tenant: course → {completions, memberCount} ringkas untuk kelola list).
- All counts derived — never stored; document the bounded-take ceilings as consts with rationale.
- UI via barrel: CourseAnalyticsView({ courseId }) — angka ringkas + bar sederhana per lesson (tanpa lib chart baru — pakai div/progress shadcn), Bahasa Indonesia. Alpha mounts into the kelola window-app.
- P0s: validators; instructor+ only — a member calling any analytics fn gets NOT_AUTHORIZED (tested); no PII beyond displayName in outputs.

Done = AGENTS.md §5 (tests: denied paths, aggregate correctness on seeded fixture, empty-course zeroes). Structured final report, then stop.
```

## Prompt — epsilon (#18 vote usulan)

```
You are agent "epsilon", one of four parallel Cowork sessions on this same project folder. Isolation: write ONLY inside slices/resources/ and convex/features/resources/ (your wave-1.1 dirs). No git. STATUS.md read-only (row #18 pre-claimed; verify #7 and #14 done, else STOP).

Onboarding: CLAUDE.md → AGENTS.md (§1 read order) → mode rules atop docs/AGENT-PROMPTS.md (rule 9: table `suggestionVotes` already in schema — implement EXACTLY per docs/DATA-MODEL.md).

Assignment — #18, voting pada usulan:
- Mutation toggleVote({ suggestionId }): requireUser → suggestion read (auth-before-read) → requireTenantRole(member) on the suggestion's tenant; idempotent toggle via by_suggestion_user (vote ada → hapus; belum → insert). tenantId from the suggestion row.
- Extend listOpen/listMine results with { voteCount, myVote } — count via by_suggestion bounded take (cap + document; sort by voteCount desc then newest, computed in-handler atas list bounded).
- UI: upvote control pada SuggestionCard (angka + tombol, optimistic via hook), Bahasa Indonesia. Update barrel + metadata pair version bump.
- P0s: validators; anon/non-member ditolak (tested); double-vote impossible (unique index path tested).

Done = AGENTS.md §5 (tests: denied paths, toggle idempotency, count correctness, cross-tenant rejection). Structured final report, then stop.
```

## Prompt — zeta (#13 e2e smoke Playwright)

```
You are agent "zeta", one of four parallel Cowork sessions on this same project folder. Isolation: write ONLY inside e2e/ and playwright.config.ts (root config file — granted for this assignment ONLY). No git. STATUS.md read-only (row #13 pre-claimed; verify #14 done, else STOP). Dependency @playwright/test is ALREADY installed by alpha — do not touch package.json; propose script additions ("e2e", "e2e:staging") in your report for alpha.

Onboarding: CLAUDE.md → AGENTS.md (§1 read order) → mode rules atop docs/AGENT-PROMPTS.md. The frontend is an OS desktop shell — read docs/UI-UX-PRD.md + slices/os-shell/README* to learn the deep-links before writing selectors.

Assignment — #13, smoke suite (anon-first, auth-ready):
- playwright.config.ts: baseURL from env E2E_BASE_URL (default http://localhost:3000), projects: chromium only (hemat), retries 1, trace on-first-retry.
- e2e/smoke.anon.spec.ts: (1) desktop shell boots (catch-all renders, no console errors), (2) deep-link /komunitas/belajar-ai opens the community window with etalase content, (3) deep-link kelas menampilkan silabus anon, (4) /masuk shows the Google sign-in affordance, (5) /profil/rahman renders public profile + badges, (6) protected window (kelola) as anon shows login gate — NEVER a crash.
- e2e/auth.setup.ts SKELETON: storageState pattern for a future authenticated run (document how Rahman records state once via `npx playwright codegen`; do NOT attempt real Google OAuth in CI).
- e2e/README.md: cara jalan lokal vs staging/prod (E2E_BASE_URL=https://study-with.rahmanef.com), kebijakan data (read-only anon; never mutate prod).
- Selectors: role/text-based (getByRole), tahan-perubahan; Bahasa Indonesia copy.

Done: config + specs + README ada di folder project; specs runnable (jalankan lokal via /tmp recipe kalau bisa — `npx playwright install chromium` boleh di /tmp copy; kalau browser download gagal di sandbox, tandai "not executed" — alpha/Rahman jalankan lokal). Structured final report, then stop.
```

## Prompt — vps (#19 FINAL: deploy v1.2 + ROTASI #12 — jalankan SETELAH alpha merge & Rahman push)

```
You are agent "vps" on the production VPS, inside ~/projects/study-with-rahmanef-com. Contract: AGENTS.md §4 ops bullet (pull --ff-only only; secrets = NAMES only; destructive ops need Rahman's explicit yes; deploy-blocking mechanical hotfix exception with mandatory alpha post-review).

Assignments: STATUS rows #19 (deploy v1.2) and #12 (ROTATION — no more deferral; Rahman is standing by this session).

Work loop:
1. git pull --ff-only origin main — confirm wave v1.2 commits (comments, analytics, votes, e2e) present.
2. npx convex deploy — schema adds `comments` + `suggestionVotes` (additive, safe) + new feature functions. Regen typed api; if committed api.d.ts is stale, apply the mechanical-hotfix exception (commit fix(ops), flag for alpha).
3. Verify Dokploy rebuild; smoke deep-links: /, /komunitas/belajar-ai, /kelas/belajar-ai/dasar-ai, /profil/rahman, /masuk (200s, no 5xx).
4. EXECUTE #12 NOW, in order, guiding Rahman: (a) JWT keypair regen + set (sessions logged out — Rahman re-logins), (b) AUTH_GOOGLE_SECRET reset in Google Cloud Console → npx convex env set → verify login end-to-end, (c) Convex admin key + INSTANCE_SECRET rotation (needs backend restart — schedule the ~1min blip with Rahman's yes), update local CLI env; remind Rahman to delete any laptop .env.local holding the old key.
5. Post-rotation checks: login works, seed:bootstrap idempotent OK, row counts (numbers only), one announcement→Discord test if webhook is configured.
6. Final report: per-step status, env var NAMES touched, smoke table, proposals. No secret values, ever.
```

## Template — re-assignment (tetap)

```
Agent "<name>": your previous assignment is merged. Re-read the mode rules atop docs/AGENT-PROMPTS.md.
Your next assignment is row #<n> — <area>; alpha pre-claimed it (verify READ-ONLY di STATUS.md + baris "Depends on"). Kontrak sama: dua direktorimu saja, no git, laporan terstruktur.
```
