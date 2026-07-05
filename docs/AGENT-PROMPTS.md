# Agent Prompts — Wave Plan & Ready-to-Paste Prompts

> Kontrak: [AGENTS.md](../AGENTS.md). Papan klaim: [STATUS.md](STATUS.md).
> Prompt di bawah ditulis Inggris agar bisa dipakai di agent tool apa pun (Claude Code, Cursor, dsb.) — paste apa adanya.

## Penamaan

| Nama | Peran | Assignment |
|---|---|---|
| **alpha** | INTEGRATOR — sesi utama Rahman. Satu-satunya yang menyentuh shared surfaces, me-review & merge branch, apply proposals | #0 scaffold, #5 landing, merge semua |
| **beta** | worker | #1 tenants → lanjut #6 request+approval (v1.1) |
| **gamma** | worker | #2 courses → lanjut #8 quiz (v1.1) |
| **delta** | worker | #4 profiles → lanjut #9 profil publik+badge (v1.1) |
| **epsilon** | worker | #3 progress (mulai saat barrel courses `review`) → lanjut #7 resources (v1.1) |
| **zeta** | worker (opsional) | #10 announcements (v1.1) |

Aturan: nama dipakai di kolom Agent STATUS.md dan di body setiap commit (`Agent: <nama>`).

## Berapa paralel?

```
Wave 0 (sekarang)  : alpha saja — #0 scaffold memblokir semuanya.
Wave 1 (v1)        : 3 serentak — beta #1, gamma #2, delta #4.
Wave 1.5 (v1)      : epsilon #3 masuk saat barrel courses siap; alpha kerjakan #5 landing. Puncak: 4 worker.
Wave 2 (v1.1)      : 5 serentak — beta #6, epsilon #7, gamma #8, delta #9, zeta #10.
```

Batas praktisnya bukan isolasi slice (folder slice tidak saling sentuh, konflik git ≈ nol) — melainkan **bandwidth review & merge alpha**. Sweet spot: **3–4 worker + alpha**. Menambah worker ke-6 hanya mempercepat kalau Rahman sanggup memantau 6 sesi.

## Operasional (penting)

1. **Jangan mulai worker sebelum STATUS #0 = `done`.**
2. Satu agent = satu sesi = satu branch = satu working copy. Setelah #0 (repo sudah ber-git), buat worktree per agent supaya tidak saling timpa file:
   `git worktree add ../bwr-beta slice/tenants` → buka sesi agent di folder `../bwr-beta`. (Atau clone terpisah.)
3. Konflik STATUS.md antar-claim jarang dan kecil (satu baris per agent) — alpha yang menyelesaikan jika terjadi.
4. Worker TIDAK push ke main. Selesai = status `review` di STATUS.md → alpha review, merge, update board ke `done`.

---

## Prompt — beta (#1 tenants)

```
You are agent "beta" working on the repo belajar-with-rahmanef.com (branch: slice/tenants).

Onboarding, in order:
1. Read CLAUDE.md, then AGENTS.md fully, then follow its §1 read order (rr-conventions → DECISIONS → PRD → DATA-MODEL → SLICES → STATUS).
2. Open docs/STATUS.md. Your assignment is row #1 — slices/tenants (tenant profile, join, memberships, roles). Verify row #0 is `done`; if not, STOP and report.
3. Claim your row: status `in-progress`, agent `beta`, branch `slice/tenants`. Commit the claim.

Hard boundaries:
- Work ONLY inside slices/tenants/ and convex/features/tenants/. App routes, convex/schema.ts, convex/_shared/**, package.json are integrator-only — write proposals in docs/STATUS.md → Proposals instead of editing.
- The schema is already composed from docs/DATA-MODEL.md — implement against tables `tenants` and `memberships` exactly as written.
- Every public Convex function: v.* validators + authz helper as the first handler line (P0). tenants.discordWebhookUrl must NEVER appear in any query result (P0).
- Deliver pages/views through your slice barrel; the integrator mounts routes.
- Request-form + approval UI are NOT yours (that is row #6) — v1 scope only.

Done = AGENTS.md §5 (tsc, convex-test incl. authz-denied, barrel test, metadata pair, ≤200 LOC). Then set your STATUS row to `review` with the last commit hash, and stop.
Commits: conventional, body includes `Agent: beta`, trailer `Co-Authored-By: Claude <noreply@anthropic.com>`.
```

## Prompt — gamma (#2 courses)

```
You are agent "gamma" working on the repo belajar-with-rahmanef.com (branch: slice/courses).

Onboarding, in order:
1. Read CLAUDE.md, then AGENTS.md fully, then follow its §1 read order.
2. Open docs/STATUS.md. Your assignment is row #2 — slices/courses (course/module/lesson CRUD + lesson viewer: YouTube embed + markdown + links). Verify row #0 is `done`; if not, STOP and report.
3. Claim your row: status `in-progress`, agent `gamma`, branch `slice/courses`. Commit the claim.

Hard boundaries:
- Work ONLY inside slices/courses/ and convex/features/courses/. Shared surfaces are integrator-only — propose via STATUS.md.
- Implement against tables `courses`, `modules`, `lessons` exactly as in docs/DATA-MODEL.md. Validate youtubeVideoId as an 11-char ID, never a full URL.
- Copy-first: evaluate the rr `markdown` slice (https://resource.rahmanef.com/agents/markdown) for the read surface before building your own renderer.
- Drafts must be invisible to members; only instructor+ sees them (authz in the query, not just UI).
- Export a stable barrel early — rows #3 (progress) and #5 (landing) consume it; publish the shape in STATUS notes as soon as it settles.

Done = AGENTS.md §5. Set STATUS row to `review` + commit hash, stop.
Commits: conventional, body `Agent: gamma`, trailer `Co-Authored-By: Claude <noreply@anthropic.com>`.
```

## Prompt — delta (#4 profiles)

```
You are agent "delta" working on the repo belajar-with-rahmanef.com (branch: slice/profiles).

Onboarding, in order:
1. Read CLAUDE.md, then AGENTS.md fully, then follow its §1 read order.
2. Open docs/STATUS.md. Your assignment is row #4 — slices/profiles, v1 minimal scope ONLY: profile record (username, displayName, avatar), auto-create on first login, settings form. Verify row #0 is `done`; if not, STOP and report.
3. Claim your row: status `in-progress`, agent `delta`, branch `slice/profiles`. Commit the claim.

Hard boundaries:
- Work ONLY inside slices/profiles/ and convex/features/profiles/. Shared surfaces are integrator-only.
- Table `profiles` exactly as in docs/DATA-MODEL.md; username unique via by_username index check (reject VALIDATION_FAILED on collision).
- Public page /u/[username] and badge wall are NOT yours (row #9, v1.1).
- isPlatformAdmin is read-only from your slice — no mutation may set it.

Done = AGENTS.md §5. Set STATUS row to `review` + commit hash, stop.
Commits: conventional, body `Agent: delta`, trailer `Co-Authored-By: Claude <noreply@anthropic.com>`.
```

## Prompt — epsilon (#3 progress; mulai saat #2 = review)

```
You are agent "epsilon" working on the repo belajar-with-rahmanef.com (branch: slice/progress).

Onboarding, in order:
1. Read CLAUDE.md, then AGENTS.md fully, then follow its §1 read order.
2. Open docs/STATUS.md. Your assignment is row #3 — slices/progress (mark-complete, progress bars, course completion). Verify row #0 is `done` AND row #2 is at least `review` (you consume the courses barrel); if not, STOP and report.
3. Claim your row: status `in-progress`, agent `epsilon`, branch `slice/progress`. Commit the claim.

Hard boundaries:
- Work ONLY inside slices/progress/ and convex/features/progress/. Consume courses ONLY through its barrel — never deep-import.
- Tables `lessonCompletions`, `courseCompletions` exactly as in docs/DATA-MODEL.md. markLessonComplete is idempotent (check by_user_lesson first); it creates the courseCompletion when the last lesson completes (check by_user_course — also idempotent).
- Progress = derived counts via indexes; never store percentages.
- A user may only write their own completions (authz: requireTenantRole member + userId from ctx, never from args).

Done = AGENTS.md §5. Set STATUS row to `review` + commit hash, stop.
Commits: conventional, body `Agent: epsilon`, trailer `Co-Authored-By: Claude <noreply@anthropic.com>`.
```

## Prompt — zeta (#10 announcements, v1.1; contoh worker v1.1)

```
You are agent "zeta" working on the repo belajar-with-rahmanef.com (branch: slice/announcements).

Onboarding, in order:
1. Read CLAUDE.md, then AGENTS.md fully, then follow its §1 read order.
2. Open docs/STATUS.md. Your assignment is row #10 — slices/announcements (in-app list + Discord webhook). Verify rows #0 and #1 are `done`; if not, STOP and report.
3. Claim your row: status `in-progress`, agent `zeta`, branch `slice/announcements`. Commit the claim.

Hard boundaries:
- Work ONLY inside slices/announcements/ and convex/features/announcements/.
- Table `announcements` exactly as in docs/DATA-MODEL.md. Create = instructor+ (requireTenantRole).
- P0: the Discord webhook URL is read ONLY inside an internal action (postToDiscord); it must never be an arg, a return value, or reachable from any public function. Webhook failure must not fail the announcement (postedToDiscord=false + server-side console.error with [announcements:postToDiscord] prefix).
- Evaluate rr `notifications-center` for the inbox UI before building your own.

Done = AGENTS.md §5. Set STATUS row to `review` + commit hash, stop.
Commits: conventional, body `Agent: zeta`, trailer `Co-Authored-By: Claude <noreply@anthropic.com>`.
```

## Template — re-assignment (v1.1, agent yang sama lanjut baris baru)

```
Agent "<name>": your previous assignment is merged. Re-read docs/STATUS.md and AGENTS.md §4.
Your next assignment is row #<n> — <area> (branch <branch>). Verify its "Depends on" rows are `done`, claim it, and proceed under the same contract. Scope and P0 notes for the row are in STATUS.md and docs/PRD.md (R<x>).
```

## Prompt v1.1 lainnya (ringkas — pakai template di atas)

- **beta → #6** (branch `slice/tenants-requests`): request form + `/admin` approval queue; evaluate rr `platform-admin` (contract-only scaffold) & `site-setup-wizard`; approval mutation = requirePlatformAdmin (P0).
- **epsilon → #7** (branch `slice/resources`): resource board + suggestion box; adapt rr `library`; install rr `rate-limit`; pending items visible only to instructor+ & submitter; >5 pending per user per tenant → RATE_LIMITED.
- **gamma → #8** (branch `slice/quiz`): MCQ builder + attempts; P0: correctIndex/explanation never in public reads — grade in submitAttempt server-side.
- **delta → #9** (branch `slice/profiles-public`): /u/[username] + badge wall from courseCompletions; evaluate rr `profile`.
