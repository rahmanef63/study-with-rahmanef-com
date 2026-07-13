# Agent Prompts — Wave v1.3 (CURRENT)

> Contract: [AGENTS.md](../AGENTS.md) · Board: [STATUS.md](STATUS.md) · Konteks ops terbaru: [reports/vps-2026-07-11.md](reports/vps-2026-07-11.md)
> LIVE: https://study-with.rahmanef.com · backend **Convex Cloud `rare-toucan-552`** · frontend OS desktop shell (deep-link windows) · **prod punya aktivitas user NYATA — jangan pernah purge/fake data**.

## EXECUTION MODE: Cowork parallel (same folder) — aturan tetap

1. Worker menulis HANYA di direktori assignment-nya. Tidak `docs/**`, `app/**`, `package.json`, `slices/os-shell/`, `slices/appshell/`, atau slice lain.
2. Board milik alpha (read-only bagi worker); klaim sudah di-pre-claim; lapor via chat (laporan terstruktur: files, barrel, hasil test, proposals, TODO).
3. No git. 4. Tests wajib DITULIS (run via /tmp copy + `npm install --legacy-peer-deps`; gagal install → "not executed"). 5. Tulis file di FOLDER PROJECT (verifikasi ada sebelum lapor). 6. Modul non-test `convex/**` = camelCase. 7. Copy ID; anonymous read hanya via §6 etalase. 8. Skema wave v1.3 SUDAH ditambah alpha (`notifications` + search index `lessons.search_content` / `courses.search_title`) — implement PERSIS per docs/DATA-MODEL.md.
9. Pola rujukan: courses/access.ts (auth-before-read) · seed.test.ts + */test.helpers.ts (fixture) · announcements/discord.ts (scheduler → internal mutation) · authz-order.test.ts (dangling-id).

## Assignments — wave v1.3

| Agent | Row | Tugas | Dirs |
|---|---|---|---|
| beta | #21 | notifikasi in-app (inbox) + producer di comments | `slices/notifications/`, `convex/features/notifications/`, + `convex/features/comments/` (producer hook saja) |
| epsilon | #22 | producer notifikasi di resources (hasil kurasi & status usulan) | `convex/features/resources/` (+ tests) |
| gamma | #23 | pencarian per komunitas (kelas + materi) | `slices/search/`, `convex/features/search/` |
| delta | #24 | sertifikat publik per badge + share | `slices/profiles/`, `convex/features/profiles/` |
| zeta | #25 | e2e hardening (annotation flip + spec baru) | `e2e/`, `playwright.config.ts` |
| vps | #26 | FINAL: deploy v1.3 (schema+functions) + smoke | Cloud CLI (dormant-role exception) |

Urutan: 5 worker paralel → alpha review (DONE 2026-07-13; mounting UI dipisah ke row #27, pola #20) → Rahman push → vps #26 (deploy backend; tidak menunggu #27) → alpha #27 mounting → Rahman: rotasi `AUTH_GOOGLE_SECRET` kapan sempat (#12).

---

## Prompt — beta (#21 notifikasi in-app)

```
You are agent "beta" (Cowork parallel; no git; STATUS read-only — row #21 pre-claimed; verify #16 done & schema `notifications` exists in convex/schema.ts, else STOP). Dirs: slices/notifications/ + convex/features/notifications/ + convex/features/comments/ (ONLY to add the producer hook).

Onboarding: CLAUDE.md → AGENTS.md → mode rules atop docs/AGENT-PROMPTS.md. Table `notifications` per docs/DATA-MODEL.md (kind: comment_reply|resource_reviewed|suggestion_status).

Build:
- convex/features/notifications: internal mutation `create` (generic producer target — validators; dedupe optional), queries `listMine` (requireUser; by_user_read unread-first, bounded take) + `unreadCount` (requireUser; bounded), mutation `markRead`/`markAllRead` (requireUser; own rows only — userId from ctx).
- Producer #1 (comment_reply): in convex/features/comments addComment — when parentId set and parent.userId ≠ ctx user, ctx.scheduler.runAfter(0, internal.features.notifications.create, {...}) with href deep-link `/kelas/<tenant>/<course>/lesson/<lessonId>` (derive from the lesson row you already loaded). Notification title/body ID, no PII beyond displayName.
- UI via barrel: NotificationBell({}) (unread badge) + NotificationInbox({}) list (mark read on click; ResponsiveDialog/popover pattern bebas asal shadcn). Alpha mounts into the OS shell header.
- Copy-first: rr `notifications-center` (https://resource.rahmanef.com/agents/notifications-center) untuk pola UI.
- P0: validators + requireUser first; recipients only read their own rows (asserted); producer never fires for self-reply (tested).

Done = AGENTS.md §5 (tests: denied paths, own-rows-only, self-reply-no-notif, markRead idempotent). Laporan terstruktur, stop.
```

## Prompt — epsilon (#22 producer notifikasi resources)

```
You are agent "epsilon" (Cowork parallel; no git; STATUS read-only — row #22 pre-claimed; verify #21 schema note & #18 done, else STOP). Dirs: convex/features/resources/ (+ its tests) ONLY.

Build (small, surgical):
- resources:curate → after approve/reject, scheduler internal.features.notifications.create utk submitter (kind resource_reviewed; title ID "Sumbermu disetujui/ditolak"; href `/resources/<tenantSlug>` — tenant slug via the tenant row you already have or load bounded).
- suggestions:setStatus → notify submitter (kind suggestion_status) kecuali submitter == actor.
- No UI. Update slice.manifest notes + version bump patch (0.2.1).
- P0: never notify the actor about their own action (tested); no new tables.

Done = AGENTS.md §5 (tests: notif row created for submitter, not for actor-self, denied paths unchanged). Laporan terstruktur, stop.
```

## Prompt — gamma (#23 pencarian per komunitas)

```
You are agent "gamma" (Cowork parallel; no git; STATUS read-only — row #23 pre-claimed; verify schema search indexes exist on lessons/courses, else STOP). Dirs: slices/search/ + convex/features/search/.

Build:
- Query searchInTenant({tenantId, q}): requireTenantRole(member) first; q 2..60 chars (VALIDATION_FAILED); jalankan dua pencarian bounded: courses.withSearchIndex("search_title", q + eq tenantId + eq status "published").take(10) dan lessons.withSearchIndex("search_content", q + eq tenantId).take(15) — lalu DRAFT-GUARD lessons: buang lesson yang course-nya bukan published (load course per hasil, bounded; atau kumpulkan courseIds → filter). Hasil = projections aman {kind:"course"|"lesson", title, courseSlug, lessonId?, snippet? (potong contentMd 120 char tanpa markdown mentah)}.
- UI via barrel: SearchView({tenantId, tenantSlug}) — input + hasil grouped, klik = deep-link (openApp seam via props onNavigate?(href) supaya slice portable; JANGAN import os-shell). Copy ID, empty state ramah.
- P0: member-only (anon/outsider ditolak — tested); draft tidak pernah muncul (tested); bounded; tanpa tabel baru.

Done = AGENTS.md §5. Laporan terstruktur (sebut shape barrel utk mounting alpha), stop.
```

## Prompt — delta (#24 sertifikat publik)

```
You are agent "delta" (Cowork parallel; no git; STATUS read-only — row #24 pre-claimed; verify #9 done, else STOP). Dirs: slices/profiles/ + convex/features/profiles/.

Build:
- Query publicGetCertificate({completionId}) — ANONYMOUS via §6 etalase (public* name): load courseCompletion by id; hanya valid bila course masih published & tenant active & profile pemilik ada; safe projection {displayName, username, courseTitle, tenantName, earnedAt} — tanpa id internal lain. Unknown/invalid → NOT_FOUND (jangan bocorkan beda kasus).
- publicListBadges: tambahkan completionId di tiap badge (untuk link sertifikat) — update type + tests.
- UI via barrel: CertificateView({completionId, shareUrl?}) — kartu sertifikat elegan (nama besar, kelas, komunitas, tanggal, tombol salin link). Copy ID. Alpha mounts deep-link `/sertifikat/<completionId>`.
- P0: projection shape asserted; §6 syarat lengkap (published/active only, bounded, validators).

Done = AGENTS.md §5. Laporan terstruktur, stop.
```

## Prompt — zeta (#25 e2e hardening)

```
You are agent "zeta" (Cowork parallel; no git; STATUS read-only — row #25 pre-claimed). Dirs: e2e/ + playwright.config.ts.

Update:
- Spec 2 (/komunitas deep-link): alpha's fix landed (5e805af) — REMOVE the test.fail annotation; assert the intended behavior plain.
- Spec 6 (kelola anon): tighten to expect the new login gate ("Masuk untuk mengelola").
- Spec baru: (7) lesson page anon → silabus terlihat tapi konten lesson terkunci/etalase saja & TIDAK crash; (8) /sertifikat/<id-ngawur> → not-found ramah tanpa crash (route mungkin belum ada saat kamu menulis — tandai test.fixme dengan catatan menunggu mounting #24); (9) suggestion board anon → login gate, no crash.
- README: catat matriks jalan (lokal dev / prod via E2E_BASE_URL) + kebijakan read-only.

Done: specs parse + (jika env memungkinkan) jalan lokal; laporan terstruktur, stop.
```

## Prompt — vps (#26 FINAL — setelah alpha merge & Rahman push)

```
You are agent "vps" (AGENTS.md §4 — dormant-role exception for Cloud deploys; secrets NAMES only). Rows: #26.

1. git pull --ff-only origin main (di clone mana pun kamu berada; atau minta Rahman jalankan langkah deploy dari laptop — Cloud deploy tidak butuh VPS).
2. npx convex deploy --prod (schema additive: notifications + 2 search index — courses.search_title & lessons.search_content; functions baru: notifications/search/producers/publicGetCertificate). Regen typed api bila stale (mechanical-hotfix exception, flag alpha).
3. Seed kurikulum baru (idempoten, aman diulang):
   npx convex run seedWebDev:seedWebDevContent '{"ownerEmail":"rahmanef63@gmail.com","tenantSlug":"belajar-ai"}' --prod
4. Smoke UI (yang SUDAH mounted): /, /komunitas/belajar-ai, /kelas/belajar-ai/dasar-ai, /kelas/belajar-ai/bikin-aplikasi-web-dengan-ai (kelas seed baru), /profil/rahman — semua 200 tanpa crash. CATATAN: bell/inbox, SearchView, dan route /sertifikat BELUM mounted (row #27, alpha) — JANGAN smoke-test itu di UI.
5. Smoke backend (dashboard/CLI, angka saja): tabel notifications ada; jalankan satu query search via dashboard function runner kalau mudah; publicGetCertificate callable dengan completionId nyata → 5 kunci tanpa id.
6. Ingatkan Rahman: #12 AUTH_GOOGLE_SECRET masih pending (owner).
7. Laporan: status per langkah, row counts (angka; JANGAN pernah purge/fake data — ada aktivitas user nyata), proposals. No secret values.
```

## Template re-assignment — tetap (lihat riwayat git bila perlu).
