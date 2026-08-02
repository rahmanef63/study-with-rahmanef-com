"use client";
// Alfa — the AI study-assistant app (#35, wave v1.6; OS-7 jadi nyata).
// Deep-link: /asisten (chat umum) atau /asisten/<lessonId> (Alfa membaca
// materi yang sedang dibuka — server re-check membership + published).
// Login-gate di sini adalah UX; chat:ask tetap menolak anon server-side (P0).
import { type AppProps } from "@/features/appshell";
import { AsistenChatView } from "@/features/asisten";
import { useCurrentProfile } from "@/features/profiles";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { LogIn, Sparkles } from "lucide-react";
import { openApp, seg } from "./_nav";

export default function AsistenApp(props: AppProps) {
  const [lessonId] = seg(props.payload);
  const { isAuthenticated, isLoading } = useCurrentProfile();

  if (isLoading) {
    return (
      <div className="w-full space-y-3 p-6 @sm:p-8" aria-busy>
        <span className="sr-only">Memuat Alfa…</span>
        <Skeleton className="h-10 w-56 max-w-full rounded-md" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-11 w-full rounded-md" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="w-full p-6 @sm:p-8">
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Sparkles aria-hidden />
            </EmptyMedia>
            <EmptyTitle className="font-serif">Masuk untuk ngobrol dengan Alfa</EmptyTitle>
            <EmptyDescription className="text-pretty">
              Alfa adalah tutor belajar AI-mu — gratis untuk semua yang sudah masuk.
            </EmptyDescription>
          </EmptyHeader>
          <Button className="min-h-11" onClick={() => openApp("masuk", "Masuk")}>
            <LogIn aria-hidden className="size-4" /> Masuk
          </Button>
        </Empty>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col">
      <header className="border-b px-6 py-4 @sm:px-8">
        <span className="eyebrow">Asisten belajar</span>
        <h1 className="font-serif text-2xl">
          Alfa <em className="italic text-primary">siap bantu</em>.
        </h1>
      </header>
      <div className="min-h-0 flex-1">
        <AsistenChatView lessonId={lessonId} />
      </div>
    </div>
  );
}
