# Agent Prompts — Wave v1.4 (CURRENT)

> Contract: [AGENTS.md](../AGENTS.md) · Board: [STATUS.md](STATUS.md) · Konteks ops terbaru: [reports/vps-2026-07-13.md](reports/vps-2026-07-13.md)
> LIVE: https://study-with.rahmanef.com · backend **Convex Cloud `rare-toucan-552`** · frontend OS desktop shell · **prod punya aktivitas user NYATA — jangan pernah purge/fake data**.
> Fitur v1.3 SUDAH live end-to-end (bell/inbox, Cari, /sertifikat, gate anon resources — mounted #27).

## EXECUTION MODE: Cowork parallel (same folder) — aturan tetap

1. Worker menulis HANYA di direktori assignment-nya (tabel di bawah). Tidak `docs/**` (kecuali disebut eksplisit di assignment), `app/**`, `package.json`, `convex/schema.ts`, atau slice/dir milik agent lain di wave ini.
2. Board milik alpha (read-only bagi worker); klaim sudah di-pre-claim; lapor via chat (laporan terstruktur: files, barrel, hasil test, proposals, TODO).
3. No git. 4. Tests wajib DITULIS untuk perubahan convex (run via /tmp copy + `npm install --legacy-peer-deps`; gagal install → "not executed"). 5. Tulis file di FOLDER PROJECT (verifikasi ada + utuh sebelum lapor — cek `wc -l`). 6. Modul non-test `convex/**` = camelCase. 7. Copy ID; anonymous read hanya via §6 etalase. 8. Skema wave v1.4 SUDAH ditambah alpha (`notifications.kind` + literal `announcement`) — implement PERSIS per docs/DATA-MODEL.md (blok "Wave v1.4 additions").
9. Pola rujukan: convex/features/comments/notify.ts + resources/notify.ts (producer scheduler → internal) · notifications/notifications.test.ts (fixture + flushScheduled) · search/queries.ts (bounded + projections) · slices/os-shell/apps/cari-app.tsx (state ladder empty/gate/skeleton).

## Assignments — wave v1.4

| Agent | Row | Tugas | Dirs |
|---|---|---|---|
| ui | #15 (final) | polish sweep permukaan v1.3 + UI-UX-PRD v3.2 + tutup arc | `slices/os-shell/**` (apps baru & chrome), `slices/profiles/components/certificate-*` + `config/certificate-labels.ts`, `docs/UI-UX-PRD.md` (satu-satunya docs yang boleh) |
| beta | #28 | notifikasi pengumuman (fan-out bounded ke member) | `convex/features/announcements/`, `convex/features/notifications/`, `slices/notifications/` |
| gamma | #29 | pencarian meluas ke papan sumber (kind `resource`) | `convex/features/search/`, `slices/search/` |
| vps | #30 | FINAL: deploy v1.4 (schema union + functions) + smoke | Cloud CLI (dormant-role exception) |

Non-overlap: ui TIDAK menyentuh `slices/notifications` & `slices/search` (milik beta/gamma wave ini); beta/gamma TIDAK menyentuh `slices/os-shell`.
Urutan: 3 worker paralel → alpha review+integrasi → Rahman push → vps #30 → (masih terbuka: #12 rotasi `AUTH_GOOGLE_SECRET`, owner).

---

## Prompt — ui (#15 FINAL polish)

```
You are agent "ui" (Cowork parallel; no git; STATUS read-only — row #15 pre-claimed, THIS is its closing pass). Dirs: slices/os-shell/** + slices/profiles/components/certificate-*.tsx + slices/profiles/config/certificate-labels.ts + docs/UI-UX-PRD.md ONLY. JANGAN sentuh slices/notifications & slices/search (agent lain sedang kerja di sana) dan JANGAN ubah perilaku/data-flow — ini polish visual & a11y murni.

Onboarding: CLAUDE.md → AGENTS.md → mode rules atop docs/AGENT-PROMPTS.md → docs/UI-UX-PRD.md (§5 Editorial Warmth + §9 checklist + DoD §10) → docs/design/BRAND.md.

Scope (permukaan baru v1.3 yang belum kena sweep Editorial Warmth):
- apps/cari-app.tsx, apps/notifikasi-app.tsx, apps/sertifikat-app.tsx, notifications-status.tsx (bell placement), + touchpoint kecil di apps/komunitas-app.tsx (quick action Cari) & apps/resources-app.tsx (gate anon).
- Checklist per permukaan: tokens only (nol hex/hardcode; pakai --chart-*, --radius-win, --hover-strong dst) · container-first reflow @sm/@md (window bisa 340px!) · target sentuh ≥44px · empty/loading/error hadir & senada · copy Bahasa Indonesia konsisten (istilah teknis tetap EN) · aria-label ikon · reduced-motion safe · font serif utk judul (pola Hero/font-serif yang ada).
- CertificateCard: pantas di-screenshot/dibagikan (ini permukaan publik paling shareable) — rapikan hierarki nama besar → kelas → komunitas → tanggal, tanpa mengubah props/shape.
- docs/UI-UX-PRD.md → v3.2: tambah 3 app baru (cari/notifikasi/sertifikat) ke peta app §3 + baris fitur §4, update angka test di DoD §10 (403), tandai arc #15 CLOSED.

DoD: tsc --noEmit hijau (scoped tsconfig ke dirs-mu cukup — lihat pola tsconfig scratch di memory worker sebelumnya); tanpa perubahan logika (diff = className/markup/copy/docs); laporan terstruktur per file dengan alasan desain singkat, stop.
```

## Prompt — beta (#28 notifikasi pengumuman)

```
You are agent "beta" (Cowork parallel; no git; STATUS read-only — row #28 pre-claimed; verify schema notifications.kind sudah punya literal "announcement" di convex/schema.ts, else STOP). Dirs: convex/features/announcements/ + convex/features/notifications/ + slices/notifications/ ONLY.

Onboarding: CLAUDE.md → AGENTS.md → mode rules atop docs/AGENT-PROMPTS.md → docs/DATA-MODEL.md blok "Wave v1.4 additions".

Build:
- convex/features/notifications: internal mutation `createMany` — validators; args {rows: v.array(<shape create>)} ATAU {tenantId, kind, title, body?, href?, recipientIds}; insert loop DI DALAM satu mutation; hard-cap array (≤200, VALIDATION_FAILED jika lebih); reuse validasi title/href dari `create` (refactor helper, jangan duplikasi).
- Producer di announcements.create (setelah insert row): baca memberships by_tenant bounded take(200) → kumpulkan userId ≠ pengirim → SATU ctx.scheduler.runAfter(0, internal.features.notifications.<createMany>, …) dengan kind "announcement", title = judul pengumuman (trim/potong wajar), href = `/pengumuman/<tenantSlug>` (tenant row sudah/boleh di-load bounded). Pengirim TIDAK menotifikasi diri sendiri (P0, tested). Jangan ganggu alur Discord yang ada.
- slices/notifications: type NotificationKind + literal "announcement"; mapping copy/ikon kind di komponen row jika ada switch per-kind (cek notification-row.tsx); TANPA perubahan visual lain (agent ui sedang polish os-shell — kamu hanya slices/notifications).
- P0: validators + authz tetap; createMany INTERNAL (bukan public); bounded; tanpa tabel baru.

Done = AGENTS.md §5 (tests: fan-out ke member lain ya / pengirim tidak, cap 200 dihormati, denied paths lama utuh, flushScheduled pattern). Laporan terstruktur, stop.
```

## Prompt — gamma (#29 pencarian sumber)

```
You are agent "gamma" (Cowork parallel; no git; STATUS read-only — row #29 pre-claimed). Dirs: convex/features/search/ + slices/search/ ONLY.

Onboarding: CLAUDE.md → AGENTS.md → mode rules atop docs/AGENT-PROMPTS.md → docs/DATA-MODEL.md blok "Wave v1.4 additions".

Build:
- searchInTenant: tambah sumber ketiga — resources APPROVED-only via index by_tenant_status (eq tenantId, eq "approved"), bounded take(50), filter judul di memori (case-insensitive contains q; TANPA search index baru). Hasil baru: {kind:"resource", title, url} — projection eksplisit, TANPA note/submittedBy/id. Batasi hasil resource take teratas 10.
- Type SearchHit + varian ResourceHit; SearchResults/SearchResultItem render grup "Sumber" — klik = buka url eksternal target="_blank" rel="noopener noreferrer" (BUKAN onNavigate); empty state tetap.
- Bump versi metadata pair slices/search 0.1.0 → 0.2.0 (sinkron slice.json + slice.manifest.json).
- P0: member-only tetap (tanpa jalur anon baru); pending/rejected TIDAK PERNAH muncul (tested); bounded; shape exact di-assert (update test shape yang ada — kind resource {kind,title,url} PERSIS).

Done = AGENTS.md §5. Laporan terstruktur (sebut perubahan shape barrel utk alpha), stop.
```

## Prompt — vps (#30 FINAL — setelah alpha merge & Rahman push)

```
You are agent "vps" (AGENTS.md §4 — dormant-role exception for Cloud deploys; secrets NAMES only). Rows: #30.

1. git pull --ff-only origin main.
2. npx convex deploy --yes (schema additive: notifications.kind + literal "announcement"; functions: notifications createMany + producer announcements + search resources). --dry-run dulu utk konfirmasi target prod rare-toucan-552. Regen typed api bila stale (mechanical-hotfix exception, flag alpha).
3. Smoke UI: /, /komunitas/belajar-ai, /kelas/belajar-ai/bikin-aplikasi-web-dengan-ai, /profil/rahman, /sertifikat/<completionId nyata via dashboard — angka saja>, /cari/belajar-ai (gate anon "Masuk untuk mencari"), /resources/belajar-ai/usulan (gate anon) — 200 tanpa crash.
4. Smoke backend: buat 1 pengumuman test di tenant belajar-ai via dashboard (fungsi asli, BUKAN insert manual) → cek rows notifications kind announcement muncul utk member lain (angka saja) — JANGAN hapus data user; searchInTenant happy-path via dashboard runner (member-authed) memuat grup resource.
5. Ingatkan Rahman: #12 AUTH_GOOGLE_SECRET masih pending (owner).
6. Laporan: status per langkah, row counts (angka), proposals. No secret values.
```

## Template re-assignment — tetap (lihat riwayat git bila perlu).
