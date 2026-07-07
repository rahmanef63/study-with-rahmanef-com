# DEPLOY — Runbook Produksi (Dokploy + Convex Self-Hosted)

> Operator: Rahman. Mode: satu VPS Dokploy menjalankan (a) Convex self-hosted via Docker Compose dan (b) app Next.js. Sesuai stack pin `docs/rr-conventions.md`.
> Referensi resmi: https://docs.convex.dev/self-hosting · https://labs.convex.dev/auth · https://docs.dokploy.com

> **Alur deploy — 2 jalur TERPISAH (PENTING).**
> - **Next app:** `git push origin main` → webhook Dokploy auto-build + auto-deploy. Tidak perlu trigger manual.
> - **Convex self-hosted:** TIDAK auto-deploy saat push. Perubahan di `convex/` (schema/functions) HANYA live setelah `npx convex deploy` manual dari laptop/CI lokal (§B). Repo ini tidak punya pre-push hook Convex — `git push` saja tidak mempublish backend.

## Arsitektur

```
[Browser] ──HTTPS──> [Next app (Dokploy)] ──NEXT_PUBLIC_CONVEX_URL──> [Convex backend :3210]
                                              (HTTP actions/auth :3211)
Convex backend ── Postgres (compose yang sama) ── volume persisten
```

Frontend = windowed **OS desktop** (satu catch-all route `app/[[...slug]]`, mount `slices/appshell` via `slices/os-shell/`); tiap path jadi deep-link URL yang membuka window. Tetap satu app Next.js seperti diagram di atas — backend Convex tidak berubah. (Detail arsitektur: AGENTS.md §0.)

## A. Convex self-hosted (sekali)

1. Di Dokploy, buat project **convex-backend** → jenis Docker Compose.
2. Pakai compose resmi dari repo get-convex/convex-backend (image `ghcr.io/get-convex/convex-backend`). Minimal yang harus diset:
   - `INSTANCE_NAME`, `INSTANCE_SECRET` (generate acak, simpan di password manager)
   - `CONVEX_CLOUD_ORIGIN` = `https://convex.<domain-mu>` (port 3210 di balik proxy)
   - `CONVEX_SITE_ORIGIN` = `https://convex-site.<domain-mu>` (port 3211 — dipakai OAuth callback)
   - Postgres + volume persisten (JANGAN pakai storage ephemeral)
3. Map domain + TLS di Dokploy untuk kedua origin di atas.
4. Generate admin key (script `generate_admin_key.sh` di container) → simpan sebagai `CONVEX_SELF_HOSTED_ADMIN_KEY`.
5. ✅ Cek: `curl https://convex.<domain-mu>/version` merespons.

## B. Deploy functions + schema (tiap rilis backend)

Dari laptop (atau CI lokal pre-push):

```bash
export CONVEX_SELF_HOSTED_URL="https://convex.<domain-mu>"
export CONVEX_SELF_HOSTED_ADMIN_KEY="<admin-key>"
npx convex deploy          # push schema + functions
npx convex codegen         # regenerate _generated bertipe penuh → commit
```

Catatan: `convex/_generated` di-commit (lihat .gitignore) supaya build Docker Next bisa typecheck tanpa menjalankan codegen.

**Ingat:** langkah ini WAJIB dijalankan manual tiap kali `convex/` berubah — `git push` ke main hanya membangun ulang app Next, TIDAK mempublish backend Convex.

## C. Auth (sekali, lalu jarang disentuh)

1. **Kunci JWT @convex-dev/auth** — set di deployment Convex:
   `JWT_PRIVATE_KEY` + `JWKS` (scaffold menyediakan `scripts/setup-auth.mjs`; `npm run build:auto` menjalankannya otomatis saat `CONVEX_DEPLOY_KEY` ada — untuk self-hosted, jalankan manual sekali dan set via `npx convex env set`).
2. `npx convex env set SITE_URL https://study-with.rahmanef.com`
3. **Google OAuth** — console.cloud.google.com → Credentials → OAuth Client (Web):
   - Authorized redirect URI: `https://convex-site.<domain-mu>/api/auth/callback/google`
   - Set di Convex: `npx convex env set AUTH_GOOGLE_ID ...` dan `AUTH_GOOGLE_SECRET ...`
4. ✅ Cek: buka `/masuk` (app Masuk di OS shell) → "Masuk dengan Google" → kembali dalam keadaan login. (Route `/login` lama sudah pensiun setelah OS pivot.)

## D. App Next.js di Dokploy (tiap push ke main)

1. Dokploy project **belajar-web** → source GitHub `rahmanef63/study-with-rahmanef-com`, branch `main`, auto-deploy on push.
2. Env build & runtime:
   - `NEXT_PUBLIC_CONVEX_URL` = `https://convex.<domain-mu>`
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
}'
```

Idempoten — aman diulang. Setelah ini akunmu = platform admin + owner komunitas pertama.

## F. Staging & rollback

- Risky change: `git push origin main:staging` → verifikasi `npm run e2e:staging` → baru main (aturan delivery rr; hanya integrator).
- Rollback app: redeploy commit sebelumnya dari UI Dokploy.
- Rollback schema: Convex schema bersifat additive di v1 (tidak ada migrasi destruktif); JANGAN menghapus field tanpa rencana migrasi.

## Biaya berjalan

VPS (sudah ada) + domain. Semua layanan lain: Rp0 (YouTube embed, Discord webhook, Google OAuth gratis).
