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
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-6 py-24 text-center">
      <h1 className="text-xl font-semibold">Komunitas belum bisa dimuat</h1>
      <p className="text-muted-foreground">Coba lagi sebentar.</p>
      <Button onClick={reset}>Coba lagi</Button>
    </div>
  );
}
