"use client";
// Adaptor capabilities.useChat → Alfa (#35): panel Inspector ⌘I "Alfa" bawaan
// appshell jadi menjawab sungguhan. Kontrak seam: hook stabil yang
// mengembalikan (messages) => AsyncGenerator<string>.
//
// Beda dengan window-app: Inspector TIDAK punya gate login sendiri dan
// merender error sebagai copy English generik — jadi adaptor ini TIDAK pernah
// melempar: anon mendapat ajakan masuk, error dipetakan ke copy Bahasa
// Indonesia dari slice, semuanya sebagai stream biasa.
import { useCallback } from "react";
import type { ChatMessage } from "@/features/appshell";
import {
  asistenErrorCode,
  mergeAsistenCopy,
  useAsistenChat,
} from "@/features/asisten";
import { useCurrentProfile } from "@/features/profiles";

const COPY = mergeAsistenCopy();

async function* say(text: string): AsyncGenerator<string> {
  for (const word of text.split(" ")) {
    yield word + " ";
    await new Promise((r) => setTimeout(r, 20));
  }
}

export function useAlfaShellChat(): (messages: ChatMessage[]) => AsyncGenerator<string> {
  const chat = useAsistenChat();
  const { isAuthenticated, isLoading } = useCurrentProfile();

  return useCallback(
    function alfaChat(messages: ChatMessage[]) {
      if (!isLoading && !isAuthenticated) return say(COPY.errNotAuthenticated);
      async function* run(): AsyncGenerator<string> {
        try {
          yield* chat(messages.map((m) => ({ role: m.role, text: m.text })));
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
    [chat, isAuthenticated, isLoading]
  );
}
