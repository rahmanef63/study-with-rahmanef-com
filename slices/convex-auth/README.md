# `convex-auth` slice

Multi-provider authentication on top of `@convex-dev/auth`. Ships a
production `<SignInPage>` + the backend wiring for **Password** (PBKDF2,
self-hosted-friendly), **Anonymous** (guest), **Google OAuth**, and
**Resend magic-link** — pick whichever ones your app needs.

`0.2.0` (2026-05-17) — lifted the working sign-in form from CareerPack;
backend was already production-grade since the previous release.

## What ships

| Surface | Where | What |
|---|---|---|
| Page | `components/sign-in-page.tsx` | Brand layout + tabbed Password forms, optional OAuth + Anonymous + magic-link |
| Hook | `hooks/index.ts` | `useAuthFlow()` — uniform `AuthResult` envelope across providers |
| Helpers | `lib/index.ts` | `validatePassword`, `looksLikeAutofillBug`, `extractAuthError` |
| Labels | `lib/labels.ts` | English defaults — override via the `labels` prop |
| Backend | `convex/features/auth/{auth,auth.config,schema,checkEmail}.ts` | `convexAuth({ providers: [Password, Anonymous, Google] })` + `loggedInUser` query + `/api/auth/check-email` httpAction |

## Why this slice exists (and what it isn't)

- **It is** a working sign-in surface you can adopt by `npx rahman-resources add convex-auth`, edit in place, and ship.
- **It is not** a Clerk replacement disguised as a wrapper — there's no managed dashboard, no hosted UI; everything renders in your Next app and your Convex deployment.
- **It is not** a kitchen-sink IdP — TOTP, passkeys, SAML are deliberately out of scope. Add via your own slice that extends `convex/features/auth/`.

## Wiring (consumer)

```ts
// convex/schema.ts
import { defineSchema } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { authTablesExt } from "./features/auth/_schema";

export default defineSchema({ ...authTables, ...authTablesExt });
```

```ts
// convex/auth.ts — re-export the slice's auth helpers from the root
// path Convex looks at by convention.
export * from "./features/auth/auth";
```

```ts
// app/proxy.ts (Next 16) — NOT middleware.ts
import { convexAuthNextjsMiddleware } from "@convex-dev/auth/nextjs/server";
export default convexAuthNextjsMiddleware();
```

```tsx
// app/(marketing)/sign-in/page.tsx
import { SignInPage } from "@/features/convex-auth";

export default function Page() {
  return (
    <SignInPage
      appName="My App"
      redirectTo="/app"
      providers={["password", "google", "anonymous"]}
    />
  );
}
```

## `<SignInPage>` props

| Prop | Default | What it does |
|---|---|---|
| `appName` | `"Your App"` | Brand name in the default footer copy. Ignored if `footer` is set. |
| `redirectTo` | `"/dashboard"` | Where to navigate after success. Ignored if `onSuccess` is set. |
| `forgotPasswordHref` | `"/forgot-password"` | Link target under the Sign-in tab. Pass `null` to hide. |
| `providers` | `["password", "google", "anonymous"]` | Array of `"password" \| "magic-link" \| "google" \| "anonymous"`. Order = render order. |
| `labels` | `DEFAULT_LABELS` (English) | `Partial<SignInLabels>` — override any subset. |
| `footer` | © `appName` line | Replace the default footer node entirely. |
| `onSuccess` | `router.push(redirectTo)` | `(provider) => void \| Promise<void>` — called instead of the default navigation. |

## i18n example

```tsx
<SignInPage
  appName="CareerPack"
  labels={{
    title: "Selamat Datang",
    description: "Masuk atau daftar untuk mulai.",
    loginTab: "Masuk",
    registerTab: "Daftar",
    loginButton: "Masuk",
    loginButtonLoading: "Memuat…",
    registerButton: "Daftar",
    registerButtonLoading: "Memuat…",
    forgotPassword: "Lupa kata sandi?",
    googleButton: "Lanjutkan dengan Google",
    anonymousButton: "Masuk sebagai Tamu",
    anonymousHint: "Sesi pribadi · tanpa daftar · data dihapus saat logout",
    anonymousTryHint: "Mau coba dulu?",
  }}
/>
```

Unspecified keys fall through to `DEFAULT_LABELS`. No deep merge — keys are flat.

## Provider notes

### `password`

- Login + Register **tabs**. Both fire `signIn("password", FormData)` with `flow=signIn` / `flow=signUp` respectively.
- Client validation mirrors `convex/features/auth/auth.ts` server-side `validatePasswordRequirements` (≥ 8, ≤ 128, must mix letters + digits).
- **PBKDF2-SHA256 100k** is used (not the default Scrypt) so the hashing round-trip stays under WebSocket action timeouts behind a reverse proxy. Default Scrypt blows past 60s on Dokploy + similar — see the inline comment in `convex/features/auth/auth.ts`. The verifier accepts legacy `pbkdf2_` (10k iter) hashes too so a consumer migrating from the older shape doesn't lose users.
- Browser-autofill safeguard: if the password field contains an `@`, the form rejects locally with `autofillEmailInPasswordError` before round-tripping. Mistyped autofill into a `name="email"` next to a `name="current-password"` is a real bug; the safeguard turns "wrong password" red herrings into a clear local message.

### `magic-link`

- `signIn("resend", { email })`. Renders inline above the tab stack.
- Requires `AUTH_RESEND_KEY`. Skip the provider if you don't want a Resend bill.

### `google`

- `signIn("google")` — full OAuth redirect. The "redirecting…" label flips on so users don't double-click during the navigation.
- Requires `AUTH_GOOGLE_ID` + `AUTH_GOOGLE_SECRET`.
- **Migration tip**: if you're moving off Clerk, use the *same* Google client ID + secret. The `sub` claim is stable across IdPs, so the existing Convex Auth account-by-provider row joins cleanly to your prior identity.

### `anonymous`

- One-tap `signIn("anonymous")` — each click mints a fresh `users` row, so two tabs / two visitors on the same device never share state.
- Renders as a small outlined button under the Sign-in tab when `password` is also enabled, or as a primary button when it's the only provider.
- Good for demo / try-before-signup flows. Pair with a "claim this anonymous account" mutation if you want to upgrade guests to real accounts later.

## `useAuthFlow()`

Wraps every provider call in `{ ok, error }`. Use it directly if you're writing a custom form:

```tsx
const flow = useAuthFlow();
const result = await flow.signInWithPassword({ email, password });
if (!result.ok) console.error(result.error);
```

Methods:
- `signInWithPassword({email, password})`
- `signUpWithPassword({email, password, name?})`
- `signInAnonymous()`
- `signInWithGoogle()`
- `sendMagicLink(email)`
- `signOut()`

All return `Promise<AuthResult>` = `{ ok: true } | { ok: false, error: string }`. `error` has already been unwrapped through `extractAuthError` — no `[Request ID: …] Server Error` noise.

## Env vars (Convex side)

| Name | Required? | Why |
|---|---|---|
| `JWT_PRIVATE_KEY` | always | Auth signing key. Run `npx @convex-dev/auth` once to generate. |
| `JWKS` | always | Public key matched to the private key above. Same command emits both. |
| `SITE_URL` | always | Magic-link callback origin. Also used as the issuer claim. |
| `AUTH_RESEND_KEY` | only with `magic-link` | Resend API key. |
| `AUTH_GOOGLE_ID` | only with `google` | OAuth client ID. |
| `AUTH_GOOGLE_SECRET` | only with `google` | OAuth client secret. |

Self-hosted: push the same env via the Convex REST `update_environment_variables` endpoint so the deployed Convex container sees them — `.env.local` only covers the dev process.

## Tables (namespaced)

The slice defines `authTablesExt` in `convex/features/auth/_schema.ts` to extend `@convex-dev/auth`'s built-in `authTables` with a `userProfiles` row (display name, avatar, timezone, locale, role). All Convex Auth tables stay namespaced (`auth_users`, `auth_accounts`, `auth_sessions`, `auth_verifiers`) so a dual-auth migration window (e.g. Clerk → Convex Auth) doesn't collide with the consumer's existing `users` table.

## What's NOT in scope

- TOTP / 2FA — add via a separate slice.
- Passkeys (WebAuthn) — same.
- SAML / enterprise SSO — same.
- A managed admin dashboard — there isn't one; query Convex directly or build your own page.
- Email verification flow — Resend magic-link doubles as verification for that provider; for Password sign-ups, add your own `userVerifications` table.

## Changelog

- **0.2.0** (2026-05-17) — production `<SignInPage>` with Password + Google + Anonymous + magic-link, `useAuthFlow` hook, i18n via `labels` prop. Lifted from CareerPack. Backend unchanged from 0.1.0 (was already production-grade).
- **0.1.0** — initial scaffold: backend wiring + stub sign-in page placeholder, README pointed at superspace for the real form.
