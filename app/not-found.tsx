import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-6 py-24 text-center">
      <h1 className="text-xl font-semibold">Halaman tidak ditemukan</h1>
      <p className="text-muted-foreground">
        Alamat yang kamu buka tidak ada — mungkin sudah dipindah atau salah ketik.
      </p>
      <Button asChild>
        <Link href="/">Kembali ke beranda</Link>
      </Button>
    </div>
  );
}
