# belajar-with-rahmanef.com

Platform & komunitas belajar pengaplikasian AI — gratis, multi-tenant, Discord-first, YouTube-embed. Charity project by Rahman.

**Agents: read [AGENTS.md](AGENTS.md) first** (binding contract), then claim your assignment in [docs/STATUS.md](docs/STATUS.md).
Docs: [DECISIONS](DECISIONS.md) · [PRD](docs/PRD.md) · [DATA-MODEL](docs/DATA-MODEL.md) · [SLICES](docs/SLICES.md) · [AGENT-PROMPTS](docs/AGENT-PROMPTS.md)

Scaffolded with [`rahman-resources`](https://www.npmjs.com/package/rahman-resources) — Next 16 + React 19 + Convex (self-hosted) + Tailwind 4 + shadcn/ui.

## Bootstrap tenant pertama (sekali, setelah login Google pertama)

```bash
npx convex run seed:bootstrap '{"ownerEmail":"rahmanef63@gmail.com","username":"rahman","displayName":"Rahman","tenantSlug":"belajar-ai","tenantName":"Belajar AI bareng Rahman","tenantDescription":"Komunitas belajar pengaplikasian AI untuk semua orang."}'
```

## Setup

```bash
npm install --legacy-peer-deps
cp .env.example .env.local           # fill NEXT_PUBLIC_CONVEX_URL etc.
npx convex dev --once                 # generates convex/_generated
npm run dev
```

## Add a slice

Browse the live showcase — the [Grand Tour](https://resource.rahmanef.com/tour) —
where every slice is mounted live with its `add` command. Then:

```bash
npx rahman-resources list
npx rahman-resources info <slug>
npx rahman-resources add landing-sections .    # marketing sections (hero/pricing/faq/blog…)
npx rahman-resources add ai-chat .             # AI chat workbench
npx rahman-resources add appshell .            # windowed web-OS shell
```

> rr is a **slice picker**: each `add` copies files into `slices/<slug>/`, which
> you own and edit. The showcase at `/tour` is Convex-free (localStorage demo
> adapters); your app wires the slice into your own backend.

## Deploy — Vercel + Convex Cloud

`vercel.json` sets `buildCommand: npm run build:auto`, which adapts to your env:

| `CONVEX_DEPLOY_KEY` | What `build:auto` runs |
|---|---|
| **set** | `setup-auth` (one-time `@convex-dev/auth` keys) → `convex deploy --cmd 'next build'` — deploys functions to Convex Cloud, codegens `convex/_generated`, and injects `NEXT_PUBLIC_CONVEX_URL` into the build. |
| **unset** | plain `next build` — zero-config deploy of the scaffold as-is (no backend wired yet). |

So a fresh deploy is green either way: set `CONVEX_DEPLOY_KEY` in Vercel for the
full Cloud-backed app, or leave it unset to ship the static scaffold first.

> **Self-hosted (Docker/Dokploy):** commit `convex/_generated` so the container
> typecheck/build runs without codegen — see `.gitignore`. (Vercel + Convex Cloud
> needs no commit; `build:auto` codegens during deploy.)

## Hard rules

- **NO Clerk.** Auth = `@convex-dev/auth`.
- **shadcn primitives only** — no raw `<dialog>`, `<input type=date|file>`.
- Use `proxy.ts` (not `middleware.ts`) on Next 16.

## Stack

| | |
|---|---|
| Framework | Next.js 16 (App Router + cacheComponents) |
| UI | React 19 + Tailwind 4 + shadcn |
| Backend | Convex (Cloud or self-hosted) |
| Auth | `@convex-dev/auth` (Password provider by default) |
