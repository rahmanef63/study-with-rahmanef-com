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

Frontend = windowed **OS desktop** (satu catch-all route `app/[[...slug]]`, mount `slices/appshell` via `slices/os-shell/`); tiap path jadi deep-link URL yang membuka window. Tetap satu app Next.js seperti diagram di atas. (Detail arsitektur: AGENTS.md §0.)

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
3. Domain `study-with.rahmanef.com` + TLS di Dokploy (live sejak 2026-07-06).
4. ✅ Cek: OS desktop (Beranda) tampil di `/`, app Masuk jalan di `/masuk`, tidak ada error di logs.

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

## F. Staging & rollback

- Risky change: `git push origin main:staging` → verifikasi `npm run e2e:staging` → baru main (aturan delivery rr; hanya integrator).
- Rollback app: redeploy commit sebelumnya dari UI Dokploy.
- Rollback schema: Convex schema bersifat additive di v1 (tidak ada migrasi destruktif); JANGAN menghapus field tanpa rencana migrasi. Rollback function/schema Cloud: `npx convex deploy` dari commit sebelumnya.

## Biaya berjalan

VPS (sudah ada) + domain + Convex Cloud (free tier). Semua layanan lain: Rp0 (YouTube embed, Discord webhook, Google OAuth gratis).
