import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function TenantNotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-6 py-20 text-center sm:py-28">
      <span className="eyebrow">404</span>
      <h1 className="text-2xl sm:text-3xl">Komunitas tidak ditemukan</h1>
      <p className="text-pretty text-muted-foreground">
        Komunitas ini tidak ada atau sedang tidak aktif.
      </p>
      <Button asChild variant="outline" className="min-h-11 sm:min-h-9">
        <Link href="/">Kembali ke beranda</Link>
      </Button>
    </div>
  );
}
