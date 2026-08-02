# rr conventions — v2 (2026-07-05)

You are coding inside a project that follows Rahman Resources (rr) conventions.
This file is EXTRACTED from the canonical `CLAUDE.md` in rahmanef63/resource-site.
If this file and CLAUDE.md disagree, CLAUDE.md wins — flag the drift.

## Rule tiers & conflict resolution

Every rule below carries a tier. When two rules conflict, the higher tier wins.

- **P0 — security & data integrity.** NEVER violate, no exceptions, no TODO escape hatch.
  If a P0 rule blocks the task, stop and report instead of working around it.
- **P1 — architecture & structure.** Violate only when genuinely necessary; every violation
  requires a `// TODO(rr): <why + what the compliant version looks like>` comment at the
  violation site AND a note in the commit body.
- **P2 — style & modularity.** Enforced by lint/audit tooling. If tooling passes, you pass.

When you cannot ask the user (autonomous run, mid-task): pick the option this document
recommends, add `// TODO(rr): confirm — chose X over Y because <reason>`, and continue.
Never silently guess without the TODO marker.

## Stack baseline (P1 — stack lock)

The pin is intentional: rr slices must compose identically across every consumer app.
"Works on my machine" is a lift blocker.

- Next.js ^16 + React ^19. No `middleware.ts` — use `proxy.ts` at project root.
- Tailwind v4 via `@tailwindcss/postcss`. `@config` bridge only during v3 migration.
- Convex self-hosted (Docker Compose on the Dokploy node), `convex` ^1.16 minimum.
- Auth = `@convex-dev/auth`. NO Clerk. Custom auth only where @convex-dev/auth is
  documented as insufficient.
- TypeScript strict.
- Drift guard: if `package.json` versions disagree with this section, flag it —
  do not silently adopt either side. (`npm run check:stack-pin` compares them in CI.)

## Vertical slice structure (P1)

- **Consumer projects:** each feature lives at `slices/<slug>/` (+ optionally
  `convex/features/<slug>/`). **rr internal repo only:** `frontend/slices/<slug>/`
  (preserves Next routing layout). Do not mix the two conventions.
- Per-slice folder shape: `components/ lib/ utils/ hooks/ config/ api/` — plus
  `types.ts`, tests, and the metadata pair.
- **Metadata PAIR (not trio):** every slice ships `slice.json` (contract folded in under
  the `contract` block, since 2026-06-21) + `slice.manifest.json`.
  Version SSOT: `slice.json.version === slice.manifest.json.version`, gated by `audit:slices`.
  `lib/content/slices.ts` scalars are GENERATED from slice.json via `gen-slice-catalog.mjs`
  — never hand-edit generated scalars.
- **Barrel-only cross-slice imports.** Inside a slice, imports resolve ONLY via
  `@/components/ui/*`, `@/shared/*`, `@/features/<own-slug>/*`, `@convex/*`, or
  relative-within-slice. No `../../` reaching into another slice.
- **Props-driven portability.** Portable slices never hardcode consumer URLs, env names,
  role enums, or copy. Hardcode = lift blocker.
- **rr backend is admin-only.** Site demos run on the localStorage adapter, NOT Convex.
  `convex/features/*` in rr is copy-source for consumers. Never compose every feature
  into rr's own `convex/schema.ts` — that turns the library into a monolith.

```ts
// DON'T — deep import into another slice's internals
import { parseMention } from "@/features/comments/lib/mention-parser";

// DO — import through the barrel; the barrel is the contract
import { parseMention } from "@/features/comments";
```

## Convex rules

### P0 — validators on every public function

```ts
// DON'T — anything goes from a crafted client
export const setRole = mutation({
  handler: async (ctx, { userId, role }) => { /* ... */ },
});

// DO — declare args with v.* validators
export const setRole = mutation({
  args: { userId: v.id("users"), role: v.union(v.literal("admin"), v.literal("member")) },
  handler: async (ctx, args) => { /* ... */ },
});
```

### P0 — server-side authz inside every mutation handler

Route-layer gates do not protect Convex HTTP endpoints.

```ts
// DON'T — trusting the Next.js layout gate
handler: async (ctx, args) => { await ctx.db.patch(args.id, { role: args.role }); }

// DO — requireUser / requireAdmin from convex/_shared/auth.ts, first line of the handler
handler: async (ctx, args) => {
  await requireAdmin(ctx);
  await ctx.db.patch(args.id, { role: args.role });
}
```

### P1 — no bare .collect(); index every filtered/ordered query

```ts
// DON'T — full table scan, degrades as the table grows
const posts = await ctx.db.query("posts").collect();

// DO — index + bounded read; add the index in defineTable(...).index(...)
const posts = await ctx.db
  .query("posts")
  .withIndex("by_author", (q) => q.eq("authorId", args.authorId))
  .take(50);
```

Exception: tiny bounded config tables (< ~50 rows by design) may `.collect()` — add
`// TODO(rr): bounded table` so the audit can whitelist it.

## Next.js rules

- **P0 — `NEXT_PUBLIC_` only for non-sensitive values.** Anything with that prefix ships
  in the client bundle. No secrets, API keys, or admin emails.
- **P0 — Server Actions verify the caller.** Every `'use server'` export authenticates AND
  authorizes before mutating. Treat them as public API endpoints.
- **P1 — `proxy.ts`, not `middleware.ts`** (Next 16 convention).
- **P1 — `next/link` + `next/image` only.** Never raw `<a href="/internal">` or `<img>`.
- **P1 — Cache Components for static reads.** Marketing/SSG pages opt into `"use cache"` +
  `cacheLife`/`cacheTag`; enable `experimental.cacheComponents` first.
- **P1 — runtime `fs.readdir`/`readFile` on repo dirs requires the dir in
  `outputFileTracingIncludes`** in next.config.mjs — works locally, silently empty in the
  standalone Docker image otherwise.

## Data fetching (P1)

- **Authed/dynamic pages:** server component calls `preloadQuery` (convex/nextjs) for first
  paint, passes the preloaded ref to a client component using `usePreloadedQuery` — reactive
  after hydration, no loading flash.
- **Reactive client state after that:** `useQuery` / `useMutation` from `convex/react`.
- **Static marketing reads:** `fetchQuery` inside a `"use cache"` component, or build-time data.
- **Never fetch in `useEffect`.** If you're reaching for `useEffect` + `fetch`/`useState`,
  the answer is `useQuery` or a server component.
- Mutations from the client go through slice-local hooks (`slices/<slug>/hooks/`), never
  called inline in JSX handlers scattered across components.

## Error handling & logging (P1)

- **Convex server:** throw `ConvexError({ code, message })` with a typed code from the
  slice's `types.ts` (e.g. `"NOT_AUTHORIZED" | "NOT_FOUND" | "RATE_LIMITED"`). Never throw
  raw strings; never leak internal details in messages sent to clients.
- **Client:** catch in the slice's mutation hook, map code → user-facing copy, surface via
  the shared toast (sonner). Never swallow an error silently; never `alert()`.
- **Route boundaries:** every route group ships `error.tsx` (and `not-found.tsx` where
  relevant). Errors render inside the shell chrome, not a white page.
- **Logging:** server-side `console.error("[<slice>:<fn>]", err)` with context prefix.
  No PII in logs. No `console.log` left in shipped client code.

```ts
// DON'T
throw new Error("db failed: " + JSON.stringify(user));

// DO
throw new ConvexError({ code: "NOT_AUTHORIZED", message: "Admin role required" });
```

## Testing (P1)

- **Co-located per slice:** unit/component tests live inside the slice —
  `slices/<slug>/__tests__/` or `<file>.test.ts(x)` next to the source. A slice's tests
  travel with it when copied.
- **What is mandatory per slice:** (1) the barrel's exported API — the contract consumers
  rely on; (2) every Convex mutation/query via `convex-test`, including the authz-denied
  path (unauthenticated caller must be rejected).
- **App level:** Playwright smoke stays global (`npm run e2e` local, `e2e:staging` against
  staging) — slices don't own e2e.
- Test files are excluded from the 200-LOC cap but still obey single-responsibility:
  one test file per source file or per behavior cluster.

## File modularity (P2 — tooling-enforced)

- **≤200 LOC per source file.** Enforced by `audit:file-size`. Exclusions: pure data
  exports (`lib/content/*.ts`, `*/seed.ts`, theme presets), `_generated/`, test files,
  and **`components/ui/*` (vendored shadcn — never edit, never count; customize by
  wrapping in `shared/` or slice components, or regenerate via the shadcn CLI).**
- **Single responsibility per file.** One default export OR one cohesive named-export
  cluster. Prefixed exports (`createX`, `parseX`, `serializeX`, `validateX`) = 4 files.
- **Extract on the SECOND occurrence.** Repeated UI pattern → `components/` or `shared/`.
  Util needed by two slices → `shared/<name>/utils/`.
- **Dynamic over hardcoded.** Lookup maps over if/switch-chains; derived selectors over
  literal arrays; `labels` props over inline copy.

```ts
// DON'T — if-chain dispatcher (grows forever, edits touch the hot file)
if (segment === "users") return <UsersBlockView />;
if (segment === "audit-log") return <AuditLogBlockView />;

// DO — registry drives dispatch; adding a block = adding a registry entry
const view = ADMIN_PANEL_BLOCKS.find((b) => b.segment === segment)?.view;
return view ? createElement(view) : <AdminFeatureCard block={block} />;
```

- **Compose, don't accumulate.** Prefer a new file that composes with the existing one
  over editing the existing one bigger.

## Naming (P2)

- Files: `kebab-case.ts(x)` (e.g. `mention-parser.ts`, `users-block-view.tsx`).
- Component exports: `PascalCase`. Hooks: `useCamelCase`. Utils/fns: `camelCase`.
- Per-slice types in `types.ts`; per-slice constants in `config/`.
- `index.ts` exists ONLY as a barrel — never put implementation in it.
- Convex: table names plural snake-free camel (`posts`, `auditLogs`); indexes `by_<field>`.

## UI rules (P1)

- **shadcn primitives only.** No raw `<button>`, `<dialog>`, `<input type=date|file>` —
  use `Button`, `ResponsiveDialog`, `DateField`, `FileUpload`.
- **Theme tokens, not hex.** `bg-background` / `text-foreground` / `border-border`.
  Semantic status colors resolve through the tones SSOT (`_shared/.../ui/tones.ts`) —
  never invent a local green-means-success.
- **Mobile-first responsive.** Single column base, layer `md:` / `lg:` upward.
- **No marketing chrome on workspace surfaces.** Workspace templates render full-bleed
  (`h-dvh`) — the workspace IS the product.
- **Shell hierarchy: exactly one outer chrome.** dashboard-shell owns admin/workspace
  chrome; admin-panel/admin/platform-admin mount INSIDE it; never nest two chromes.
  *(This project's single outer chrome is now `slices/appshell` — the windowed OS
  desktop — not `dashboard-shell`; the rule is unchanged, only the chrome moved. See
  AGENTS.md §0.)*

## Delivery rules (P1)

- **Solo-dev flow:** tests + typecheck + validate green → push direct to main. No PRs.
  Dokploy auto-deploys. Risky changes go to staging first:
  `git push origin main:staging` → verify `e2e:staging` → then main.
- **Conventional commits:** `feat(scope): subject` / `fix` / `chore`. Body explains WHY,
  and lists any P1 deviations (`TODO(rr)` markers added this commit).
- **Co-author the AI:** end AI-assisted commits with
  `Co-Authored-By: Claude <noreply@anthropic.com>`.
- **P0 — publish guardrail:** NEVER run `npm publish` yourself. When the publish conditions
  hold (packages/ modified + version bumped above `npm view` + tsc green + pushed to main),
  end your response with the publish suggestion and let the user run the OTP step.
- No GitHub Actions cloud minutes — local CI via pre-push hook; Dokploy builds on push.

## Copy-first & Source Map (P1)

- **Never greenfield what a proven source already solved.** Check the Source Map in
  CLAUDE.md first; `cp -r` → adjust import aliases → strip business-specific bits.
- Source Map paths are machine-local (`~/projects/...`). **If a source path does not exist
  on this machine, STOP and ask** — do not reconstruct the component from memory; that
  defeats copy-first.

## TEMPLATE vs SLICE (P1)

Two installable kinds; confusing them is the #1 support issue.

- **TEMPLATE** = whole-app scaffold (catalog: `lib/content/layouts.ts`). Install
  `npx rr add <template-slug>` — defaults to `--at root` (routes promoted to
  `app/(public)/` + `app/admin/`, `/preview/<slug>` constants auto-rewritten).
  `--at preview` only for sandbox demos. Templates do NOT ship slice metadata — they are
  monolithic scaffolds you fork.
- **SLICE** = one self-contained vertical feature (catalog: `lib/content/slices.ts`).
  Install `npx rr add <slice-slug>` → copied into `slices/<slug>/` (+ optional
  `convex/features/<slug>/`) with the metadata pair. Slices with variants:
  `add <slug> <variant>` flattens one variant; `add <slug>` copies all + switcher prop.
- **Trust the CLI banner** (`[TEMPLATE]` / `[SLICE]`). Wrong banner = wrong slug.
- **Lift = sanitize first** (slice path only): strip consumer URLs, env names, role enums,
  table coupling → replace with props / env-configured allowlists. `npx rr lift` is
  operator-manual.
- **MCP connectors:** `npx rr add create-your-mcp` — never hand-roll OAuth/PKCE.

## Enforcement map (what checks what)

| Rule | Enforced by |
| --- | --- |
| ≤200 LOC | `audit:file-size` + eslint `max-lines` |
| Barrel-only imports | eslint `no-restricted-imports` / boundaries + `audit:slices` |
| No raw `<a>`/`<img>`/`<button>` | eslint `no-restricted-syntax` |
| Validators + authz on Convex fns | `audit-bp` (P0 gate) |
| Metadata pair version match | `audit:slices` |
| Catalog scalars = generated | `gen:catalog:check` (pre-commit) |
| Stack pin vs package.json | `check:stack-pin` |
| Skills JSON sync | `sync-skills.mjs --check` (prepublishOnly) |
| Types | `npx tsc --noEmit` |

If a rule here has no tooling row yet, the prompt is its only guard — treat it as P1.

## Agent protocol

1. BEFORE writing code: scan whether the change crosses a rule; follow it even if unasked.
2. BEFORE adding a dependency: check the rr catalog (`npx rr list` or /slices) first.
3. BEFORE a new feature: does it belong in `slices/<slug>/` (+ `convex/features/<slug>/`)?
4. AFTER editing: `npx tsc --noEmit` + relevant `npm run validate:*` / `audit:*`.
5. When proposing changes, STATE which rules they honor, e.g.: "Using `requireAdmin` per
   'server-side authz'; indexed via `.withIndex` per 'no bare .collect()'."
6. Existing code violating a rule: point it out, fix ONLY if asked (scope-creep guard).
7. Blocked on a decision and can't ask: take the recommended option, mark
   `// TODO(rr): ...`, list it in the commit body.
8. P0 conflict with the task itself: stop and report; do not route around P0.
