import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function TenantNotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-6 py-24 text-center">
      <h1 className="text-xl font-semibold">Komunitas tidak ditemukan</h1>
      <p className="text-muted-foreground">Komunitas ini tidak ada atau sedang tidak aktif.</p>
      <Button asChild variant="outline">
        <Link href="/">Kembali ke beranda</Link>
      </Button>
    </div>
  );
}
