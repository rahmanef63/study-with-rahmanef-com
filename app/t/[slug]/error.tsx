"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function TenantError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[tenant:error]", error.digest ?? error.message);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-6 py-20 text-center sm:py-28">
      <span className="eyebrow">Ada gangguan</span>
      <h1 className="text-2xl sm:text-3xl">Komunitas belum bisa dimuat</h1>
      <p className="text-pretty text-muted-foreground">Coba lagi sebentar.</p>
      <Button onClick={reset} className="min-h-11 sm:min-h-9">
        Coba lagi
      </Button>
    </div>
  );
}
