# DEPLOY — Runbook Produksi (Dokploy + Convex Cloud)

> Operator: Rahman. Mode: app Next.js di **Dokploy VPS**; backend di **Convex Cloud** (managed).
> **Migrasi 2026-07-10:** backend pindah dari Convex self-hosted → **Convex Cloud**. Stack self-hosted lama (`api-study-with.rahmanef.com`, Docker Compose) sudah **pensiun** (container mati, 404). Runbook self-hosted lama diarsipkan di git history.
> Referensi resmi: https://docs.convex.dev · https://labs.convex.dev/auth · https://docs.dokploy.com

> **Alur deploy — 2 jalur TERPISAH (PENTING).**
> - **Next app:** `git push origin main` → webhook Dokploy auto-build + auto-deploy. Tidak perlu trigger manual.
> - **Convex Cloud:** TIDAK auto-deploy saat push. Perubahan di `convex/` (schema/functions) HANYA live setelah `npx convex deploy --yes` manual (§B). Repo ini tidak punya pre-push hook Convex — `git push` saja tidak mempublish backend.

## Arsitektur

```
[Browser] ──HTTPS──> [Next app (Dokploy)] ──NEXT_PUBLIC_CONVEX_URL──> [Convex Cloud: rare-toucan-552.convex.cloud]
                                              (auth/HTTP actions/JWKS: rare-toucan-552.convex.site)
Convex Cloud ── managed storage (tidak ada Postgres/volume yang kita urus)
```

Frontend = app komunitas ber-tab di **rute Next.js sungguhan** (`/k/<slug>/…`), bukan lagi OS desktop berjendela — `slices/appshell`, `slices/os-shell` dan catch-all `app/[[...slug]]` dihapus pada pivot rute 2026-08-09. Server rendering **selalu anonim** (token di localStorage, `proxy.ts` stub), jadi hanya query etalase yang boleh lewat `lib/convex-server.ts`. (Detail arsitektur: AGENTS.md §0.)

## A. Deployment Convex Cloud (sekali)

Deployment prod sudah ada — **project `template-projects/study-with-rahmanef-com`, deployment prod `rare-toucan-552`**. Tidak ada infra yang kita provision (Convex Cloud managed).

- Auth CLI = login Convex Rahman (`~/.convex/config.json` `accessToken`) — `npx convex deploy` auto-target deployment PROD project ini.
- `.env.local` `CONVEX_DEPLOYMENT=dev:coordinated-finch-69` hanya memilih **project** (itu deployment DEV). Prod dituju otomatis oleh `deploy`, atau eksplisit `--prod` untuk `run`/`env`/`data`.
- ✅ Cek: `curl https://rare-toucan-552.convex.cloud/version` merespons; JWKS di `https://rare-toucan-552.convex.site/.well-known/jwks.json`.

## B. Deploy functions + schema (tiap rilis backend)

Dari laptop (login Convex Rahman):

```bash
npx convex deploy --yes     # push schema + functions ke PROD (typecheck dulu, abort kalau error)
npx convex codegen          # regenerate _generated bertipe penuh → commit
```

- **JANGAN** `--prod` pada `deploy` (sudah prod; flag tak ada). **JANGAN** `-v` pada `deploy` — verbose men-dump VALUE env (AUTH_GOOGLE_SECRET dll) ke stdout.
- CI alternatif: set `CONVEX_DEPLOY_KEY` (dari dashboard Cloud) lalu `npx convex deploy` — tak butuh login interaktif.
- `convex/_generated` di-commit (lihat .gitignore) supaya build Docker Next bisa typecheck tanpa menjalankan codegen.

**Ingat:** langkah ini WAJIB manual tiap kali `convex/` berubah — `git push` ke main hanya membangun ulang app Next, TIDAK mempublish backend Convex.

## C. Auth (sekali, lalu jarang disentuh)

Semua env di-set pada deployment Cloud dengan `npx convex env set <NAME> <value> --prod`:

1. **Kunci JWT @convex-dev/auth** — `JWT_PRIVATE_KEY` + `JWKS` (scaffold: `scripts/setup-auth.mjs`; `npm run build:auto` menjalankannya otomatis saat `CONVEX_DEPLOY_KEY` ada — atau jalankan manual sekali dan set via `npx convex env set`).
2. `npx convex env set SITE_URL https://study-with.rahmanef.com --prod`
3. **Google OAuth** — console.cloud.google.com → Credentials → OAuth Client (Web):
   - Authorized redirect URI: `https://rare-toucan-552.convex.site/api/auth/callback/google`
   - Set di Convex: `npx convex env set AUTH_GOOGLE_ID ... --prod` dan `AUTH_GOOGLE_SECRET ... --prod`
4. ✅ Cek: buka `/masuk` → "Masuk dengan Google" → kembali dalam keadaan login.

Env NAMES prod (values JANGAN pernah di-print/commit): `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `JWKS`, `JWT_PRIVATE_KEY`, `SITE_URL`.

## D. App Next.js di Dokploy (tiap push ke main)

1. Dokploy project **belajar-web** → source GitHub `rahmanef63/study-with-rahmanef-com`, branch `main`, auto-deploy on push.
2. Env build & runtime:
   - `NEXT_PUBLIC_CONVEX_URL` = `https://rare-toucan-552.convex.cloud`
   - `NEXT_PUBLIC_CONVEX_SITE_URL` = `https://rare-toucan-552.convex.site`
   - `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` = acak 32-byte base64 (pin sekali)
   - `APP_REVISION` = SHA commit yang sama pada Docker build argument dan runtime. Deployment ID dibekukan dalam build; `/api/version` dan `/api/health` melaporkan ID tersebut, bukan BUILD_ID Next yang dapat dipakai ulang.
3. Domain `study-with.rahmanef.com` + TLS di Dokploy (live sejak 2026-07-06).
4. ✅ Cek: `/` menampilkan landing komunitas unggulan, `/k/<slug>` merender header + rail komunitas dengan daftar kelas sebagai HTML (bukan cangkang kosong), `/masuk` jalan, tidak ada error di logs.

## E. Seed tenant pertama (sekali, SETELAH login Google pertamamu)

```bash
npx convex run seed:bootstrap '{
  "ownerEmail": "rahmanef63@gmail.com",
  "username": "rahman",
  "displayName": "Rahman",
  "tenantSlug": "belajar-ai",
  "tenantName": "Belajar AI bareng Rahman",
  "tenantDescription": "Komunitas belajar pengaplikasian AI untuk semua orang."
}' --prod
```

Idempoten — aman diulang. Setelah ini akunmu = platform admin + owner komunitas pertama. Seed lanjutan (dunia + engagement flagship): `seed:seedWorld`, `seed:seedEngagement` (lihat header `convex/seed.ts`).

## F. Acceptance, backfill & rollback

AGENTS §4 melarang agent deploy. Semua langkah produksi berikut dijalankan operator setelah persetujuan release. Push ke main dapat memicu frontend; pastikan backend yang kompatibel siap dahulu.

1. Verifikasi kandidat di worktree/branch terpisah: `npm ci`, `npm run audit`, `npm run lint`, `npm run typecheck`, `npm test`, lalu build dengan URL Convex publik dan `APP_REVISION`. Jalankan server standalone beserta `public` dan `.next/static`, cek health/version, jalankan E2E anonim dan inspeksi desktop/mobile. `npm run e2e:staging` membutuhkan E2E_STAGING_URL nyata; branch staging saja tidak membuktikan deployment. Tidak ada domain staging tetap yang dikonfigurasi.
2. Sebelum release, simpan revision/config dan image rollback frontend; jangan mencetak secret. Konfirmasi target frontend Dokploy dan backend Convex secara terpisah. Gunakan additive schema dahulu; backend baru tetap kompatibel dengan frontend lama.
3. Setelah deploy backend, migrasikan snapshot `courseLessons.lessonPublished` melalui internal mutation `features/progress/placementBackfill:run`. Tidak berjalan otomatis, tidak mengubah isi materi/progress/badge. Setiap pemanggilan memproses 10 placement. Mulai dengan cursor null:

```bash
npx convex run features/progress/placementBackfill:run '{"cursor":null,"dryRun":true}' --prod
```

Lanjutkan setiap halaman dengan `cursor` persis dari `continueCursor` sampai `isDone=true`. Catat jumlah scanned/mismatches. Setelah hasil dry-run direview, ulangi dari cursor null tanpa dryRun untuk menulis snapshot. Terakhir mulai lagi dari cursor null dengan `verifyOnly:true`, ikuti seluruh cursor sampai selesai dan pastikan total mismatches=0. Jangan menyimpulkan migrasi selesai dari satu halaman. Mutasi status/placement menjaga snapshot dalam transaksi yang sama selama migrasi berjalan.

4. Sebelum backfill lengkap, fallback legacy dibatasi 10 dokumen per transaksi. Kelas besar dapat menunjukkan data belum lengkap; tidak ada badge dari hitungan terpotong. Materi baru maksimal 50 penempatan kelas, kelas maksimal 200 materi. Completion menyelesaikan 3 kelas langsung, sisanya melalui pekerjaan internal terbatas yang memeriksa ulang akses dan placement.
5. Verifikasi frontend live: health status ok, version ID sama dengan build, revision sesuai SHA; respons memakai no-store. Health hanya menguji kesiapan frontend, sehingga cek Convex dan login/materi/kuis/member flow dilakukan terpisah. Tes restart serta perpindahan rute, mobile, keyboard dan sesi anggota. Jangan menyamakan build lokal dengan release live.
6. Rollback frontend: redeploy image terdahulu yang telah disimpan. Rollback backend: deploy fungsi lama dengan schema tetap menerima field opsional `lessonPublished` jika sudah ditulis. Mengembalikan schema lama persis setelah backfill dapat menolak row baru. Penghapusan snapshot perlu migrasi tersendiri yang direview; jangan menghapus data sebagai rollback. Snapshot bukan salinan isi materi.

Catatan runtime dan image rollback aktual berada dalam laporan bertanggal di `docs/reports/`, bukan kontrak permanen ini.

## Biaya berjalan

VPS (sudah ada) + domain + Convex Cloud (free tier). Semua layanan lain: Rp0 (YouTube embed, Discord webhook, Google OAuth gratis).
