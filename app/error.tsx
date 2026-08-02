"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app:error]", error.digest ?? error.message);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-6 py-24 text-center">
      <h1 className="text-xl font-semibold">Ada yang tidak beres</h1>
      <p className="text-muted-foreground">
        Terjadi kesalahan tak terduga. Coba muat ulang — kalau masih bermasalah,
        laporkan lewat Discord komunitas ya.
      </p>
      <Button onClick={reset}>Coba lagi</Button>
    </div>
  );
}
