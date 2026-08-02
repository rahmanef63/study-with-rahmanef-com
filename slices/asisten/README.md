# asisten — Alfa, the AI study tutor (wave v1.6, STATUS #35)

> Part of **belajar-with-rahmanef.com** (desktop OS shell). Barrel-only
> imports; see `index.ts` for the contract.

A Claude-powered study assistant inside the OS shell. Two surfaces:

1. **Window-app `asisten`** — deep-link `/asisten` (general chat) or
   `/asisten/<lessonId>` (Alfa also reads the lesson currently open).
2. **Inspector ⌘I** — `capabilities.useChat` is wired to `useAsistenChat`,
   so the shell's built-in "Alfa" panel answers for real.

## Security & cost

- `chat:ask` = a public action that **requires sign-in** (auth as the first step, P0).
- Lesson context flows through an internal query that enforces **membership** and
  **course published** — drafts never leak through the assistant (§6).
- Bounded per request: ≤20 messages, ≤4000 chars/message, lesson context truncated
  at 8000 chars, answers capped at `max_tokens` 1024, Haiku model (the cheapest).
- **No per-user quota** (owner decision 2026-07-16). Global kill-switch:
  unset `ANTHROPIC_API_KEY` → Alfa politely reports "belum aktif".
- The API key is read from the server env only; provider error bodies are never
  forwarded to the client (asserted in tests).

## Activation (owner)

    npx convex env set ANTHROPIC_API_KEY <kunci> --prod

The key value never passes through the repo or chat — the owner runs this themselves.
