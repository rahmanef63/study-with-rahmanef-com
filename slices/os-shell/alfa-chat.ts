"use client";
// Adaptor capabilities.useChat → Alfa (#35): panel Inspector ⌘I "Alfa" bawaan
// appshell jadi menjawab sungguhan. Kontrak seam: hook stabil yang
// mengembalikan (messages) => AsyncGenerator<string>.
//
// Beda dengan window-app: Inspector TIDAK punya gate login sendiri dan
// merender error sebagai copy English generik — jadi adaptor ini TIDAK pernah
// melempar: anon mendapat ajakan masuk, error dipetakan ke copy Bahasa
// Indonesia dari slice, semuanya sebagai stream biasa.
//
// PERF: asisten DIPARKIR owner (PARKED_APP_IDS di os-root) tapi capabilities
// dikirim eager ke AppShell — barrel-nya di-import lazy DI DALAM generator
// supaya slice-nya tidak ikut initial JS chunk. Identity hook tetap stabil
// (useCallback) per kontrak capabilities.
import { useCallback } from "react";
import { useConvex } from "convex/react";
import type { ChatMessage } from "@/features/appshell";
import { useCurrentProfile } from "@/features/profiles/hooks";

async function* say(text: string): AsyncGenerator<string> {
  for (const word of text.split(" ")) {
    yield word + " ";
    await new Promise((r) => setTimeout(r, 20));
  }
}

export function useAlfaShellChat(): (messages: ChatMessage[]) => AsyncGenerator<string> {
  const convex = useConvex();
  const { isAuthenticated, isLoading } = useCurrentProfile();

  return useCallback(
    function alfaChat(messages: ChatMessage[]) {
      async function* run(): AsyncGenerator<string> {
        const { sendAsistenChat, asistenErrorCode, mergeAsistenCopy } = await import(
          "@/features/asisten"
        );
        const COPY = mergeAsistenCopy();
        if (!isLoading && !isAuthenticated) {
          yield* say(COPY.errNotAuthenticated);
          return;
        }
        try {
          yield* sendAsistenChat(
            convex,
            messages.map((m) => ({ role: m.role, text: m.text })),
          );
        } catch (err) {
          switch (asistenErrorCode(err)) {
            case "NOT_AUTHENTICATED":
              yield* say(COPY.errNotAuthenticated);
              return;
            case "RATE_LIMITED":
              yield* say(COPY.errRateLimited);
              return;
            case "VALIDATION_FAILED":
              yield* say(COPY.errValidation);
              return;
            default:
              yield* say(COPY.errNotFound);
              return;
          }
        }
      }
      return run();
    },
    [convex, isAuthenticated, isLoading]
  );
}
