# e2e — smoke suite Playwright (anon-first, auth-ready)

Suite smoke atas **OS desktop shell** (deep-link windows, bukan route pages —
lihat `AGENTS.md` §0 + `docs/UI-UX-PRD.md` §3). Semua spec berjalan sebagai
**anonim** dan **read-only** — aman dijalankan terhadap produksi.

## Prasyarat

- `@playwright/test` sudah ada di devDependencies (dipasang alpha).
- Browser sekali saja: `npx playwright install chromium`

## Cara jalan — lokal

```bash
# terminal 1 — app (butuh Convex dev / env yang valid)
npm run dev

# terminal 2 — suite (default baseURL http://localhost:3000)
npx playwright test
```

## Cara jalan — staging / prod

```bash
# staging (flow AGENTS.md §4: push main:staging → verifikasi → main)
E2E_BASE_URL=https://<staging-host> npx playwright test

# produksi
E2E_BASE_URL=https://study-with.rahmanef.com npx playwright test
```

Windows PowerShell: `$env:E2E_BASE_URL="https://study-with.rahmanef.com"; npx playwright test`

Skrip npm yang DIUSULKAN ke alpha (package.json = shared surface, zeta tidak
menyentuhnya): `"e2e": "playwright test"` dan
`"e2e:staging": "E2E_BASE_URL=https://study-with.rahmanef.com playwright test"`.

## Konfigurasi (env)

| Var | Default | Fungsi |
|---|---|---|
| `E2E_BASE_URL` | `http://localhost:3000` | target suite |
| `E2E_TENANT` | `belajar-ai` | slug komunitas seeded |
| `E2E_COURSE` | `dasar-ai` | slug kelas seeded |
| `E2E_USERNAME` | `rahman` | username profil publik seeded |

Laporan HTML: `npx playwright show-report e2e/playwright-report`
(artefak diarahkan ke dalam `e2e/` dan sudah di-gitignore di `e2e/.gitignore`).

## Kebijakan data (WAJIB)

- **Anon read-only.** Spec hanya menyentuh permukaan etalase §6 (`public*` /
  whitelist) — tidak ada login, tidak ada mutation, tidak menekan tombol yang
  menulis data. **Jangan pernah menambahkan spec yang memutasi produksi.**
- Spec authenticated (masa depan) hanya boleh menarget **lokal/staging**.
- `e2e/.auth/user.json` (storage state hasil rekam) berisi token sesi hidup —
  gitignored, jangan pernah di-commit atau ditempel di chat.

## Menuju run authenticated (auth.setup.ts)

Google OAuth **tidak** diotomasi di CI (ToS + bot detection). Pola yang dipakai:
rekam storage state sekali secara manual, pakai ulang lewat project Playwright.
Resep lengkap ada di header `e2e/auth.setup.ts`; ringkas:

1. `npx playwright codegen --save-storage=e2e/.auth/user.json http://localhost:3000/masuk`
   → login manual di jendela yang terbuka, tutup.
2. Un-comment project `chromium-auth` di `playwright.config.ts`.
3. Tulis spec member sebagai `e2e/<nama>.auth.spec.ts`.

## Peta spec ↔ copy SSOT

Selector berbasis role/teks atas copy Bahasa Indonesia. Kalau copy berubah,
spec sengaja gagal — perbarui bersama SSOT-nya:

| Spec | Marker | SSOT |
|---|---|---|
| 1 boot | "Komunitas belajar AI · Bahasa Indonesia" | `slices/os-shell/apps/beranda-app.tsx` |
| 2 komunitas | "Mulai belajar di sini." · "Login untuk gabung" · "Sumber & usulan" | `komunitas-app.tsx` · `slices/tenants/config/labels.ts` |
| 3 kelas | eyebrow "Kelas" · `section[aria-label="Modul"]` | `slices/courses/config/copy.ts` |
| 4 masuk | tombol "Masuk dengan Google" | `masuk-app.tsx` |
| 5 profil | "Profil anggota" · `@<username>` · `section[aria-label="Lencana Kelas"]` | `profil-app.tsx` · `slices/profiles/config/public-labels.ts` |
| 6 kelola | "Khusus pengelola" | `kelola-app.tsx` |
